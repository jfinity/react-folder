import React, { createContext, useContext, useRef, useEffect } from "react";

const initKey = (name = ".") => {
  const key = name.toString() || ".";

  return /\/|\.\.|.\.$/.test(key) ? "" : key;
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

const basename = path =>
  path.slice(1 + path.lastIndexOf("/", path.length - 2), -1);

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
  const { current } = useRef({ silent, watch, xform: echo, callback: echo });

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
  const { name = "", children } = props;
  const key = initKey(name);
  const node = useSubtree(key);
  const bn = basename(node.path);

  switch (key) {
    case "": {
      throw new Error("Invalid folder name");
    }
    case ".": {
      return (
        <React.Fragment>
          {typeof children === "function" ? children(node.path, bn) : children}
        </React.Fragment>
      );
    }
    default: {
      return (
        <Directory.Provider value={node}>
          {typeof children === "function" ? children(node.path, bn) : children}
        </Directory.Provider>
      );
    }
  }
};

export const mkdir = (options, Component) => {
  const { name = "" } = options || {};

  return props => {
    const { folder = name } = props;
    const key = initKey(folder);
    const parent = useContext(Directory);
    const next = subpath(parent.path, key);
    const bn = basename(next);

    if (key === "") {
      throw new Error("Invalid folder name");
    }

    return key === "." ? (
      <Component pwd={next} basename={bn} {...props} />
    ) : (
      <Folder name={folder}>
        <Component pwd={next} basename={bn} {...props} />
      </Folder>
    );
  };
};

export const usePathname = () => useContext(Directory).path;
