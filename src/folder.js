import React, { createContext, useContext, useRef, useEffect } from "react";

const initKey = (name = "", ext = "") => {
  const prefix = name.toString();
  const suffix = ext.toString();
  const infix = suffix ? "." : "";
  const key = prefix + infix + suffix || ".";

  return prefix.indexOf(".") > -1 || /\/|\.\.|.\.$/.test(key) ? "" : key;
};

const deltaKey = (key, contents, amount = 0) => {
  const total = (0 | contents.get(key)) + amount;

  if (total === 0) {
    contents.delete(key);
  } else {
    contents.set(key, total);
  }

  return total;
};

const initNode = (path = "", contents = new Map()) => ({ path, contents });

const Directory = createContext(initNode("", new Map()));

const subpath = (path, key) =>
  key === "" || key === "." ? path : path + key + "/";

const logRed = action => {
  if (action && action.payload && action.payload.warn) {
    console.error(action.type, action.payload.warn, action);
  }

  return action;
};

const Watcher = createContext(logRed);

const check = (val, ok) => conflict(val, ok) || corrupt(val, ok);
const conflict = (val, ok) => (val > ok ? "conflict" : "");
const corrupt = (val, ok) => (val < ok ? "corrupt" : "");

const echo = action => action;

const useSubtree = key => {
  const parent = useContext(Directory);
  const next = subpath(parent.path, key);

  const { current } = useRef({
    node: initNode(parent.path, null),
    callback: echo
  });

  current.callback = useContext(Watcher) || echo;

  current.node =
    next === current.node.path
      ? current.node
      : initNode(next, current.node.contents || new Map());

  useEffect(() => {
    if (key === "" || key === ".") {
      return;
    }

    const amount = deltaKey(key, parent.contents, 1);
    const handle = current.callback;
    if (typeof handle === "function") {
      handle({ type: "onWrite", payload: { warn: check(amount, 1) } });
    }

    return () => {
      const total = deltaKey(key, parent.contents, -1);
      // TODO: consider current handle vs. cached handle implications
      if (typeof handle === "function") {
        handle({ type: "onErase", payload: { warn: check(total, 0) } });
      }
    };
  }, [key, parent.contents, current]); // current (ref) should not change

  return current.node;
};

// TODO: validate the utility of the following APIs
// const splitPath = (path = "") => path.split("/");
// const joinPath = (steps = [""]) => steps.join("/");
// const splitStep = (step = "") => step.split(".");
// const joinStep = (texts = [""]) => texts.join(".");
// const splitBoth = (path = "") => splitPath(path).map(splitStep);
// const joinBoth = (value = [[""]]) => joinPath(value.map(joinStep));

export const Monitor = props => {
  const { watch = echo, silent = false, children } = props;
  const { current } = useRef({ silent, watch, xfrom: echo, callback: echo });

  current.xform = useContext(Watcher) || echo;
  current.watch = watch || echo;
  current.silent = !!silent;

  current.callback =
    current.callback !== echo
      ? current.callback
      : action => {
          const { xform: capture, watch: handle, silent: quiet } = current;
          const value = quiet && capture === logRed ? action : capture(action);
          return value ? handle(action) : value;
        };

  return (
    <Watcher.Provider value={current.callback}>{children}</Watcher.Provider>
  );
};

export const Folder = props => {
  const { name = "", ext = "", children } = props;
  const key = initKey(name, ext);
  const node = useSubtree(key);

  switch (key) {
    case "": {
      throw new Error("Invalid folder name/extension");
    }
    case ".": {
      return (
        <React.Fragment>
          {typeof children === "function"
            ? children(node.path, key, name, ext)
            : children}
        </React.Fragment>
      );
    }
    default: {
      return (
        <Directory.Provider value={node}>
          {typeof children === "function"
            ? children(node.path, key, name, ext)
            : children}
        </Directory.Provider>
      );
    }
  }
};

export const mkdir = (options, Component) => {
  const { name = "", ext = "" } = options || {};

  return props => {
    const { folder = name, group = ext } = props;
    const key = initKey(folder, group);
    const parent = useContext(Directory);
    const next = subpath(parent.path, key);

    if (key === "") {
      throw new Error("Invalid folder name/extension");
    }

    return key === "." ? (
      <Component pwd={next} {...props} />
    ) : (
      <Folder name={folder} ext={group}>
        <Component pwd={next} {...props} />
      </Folder>
    );
  };
};

export const usePWD = () => useContext(Directory).path;

// TODO: consider relocating this function in a different package
export const useJournal = (emit, file = "") => {
  const { current } = useRef({ dir: "", file, emit, handle: null });

  current.dir = usePWD();
  current.file = file;
  current.emit = emit;

  current.handle =
    current.handle ||
    ((type, payload) => {
      const dispatch = current.emit;
      if (typeof dispatch === "function") {
        dispatch({
          dir: current.dir,
          file: current.file,
          type,
          payload
        });
      }
    });

  return current.handle;
};
