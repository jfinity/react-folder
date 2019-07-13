import React, { createContext, useContext, useRef, useEffect } from "react";

const initKey = (name = "", ext = "") => {
  const prefix = name.toString();
  const suffix = ext.toString();
  const infix = suffix ? "." : "";
  const key = prefix + infix + suffix || ".";

  return prefix.indexOf(".") > -1 || /\/|\.\.|.\.$/.test(key) ? "" : key;
};

const writeKey = (key, contents) => {
  if (contents.has(key)) {
    return contents.set(key, +contents.get(key) + 1 || 2).get(key);
  }

  contents.set(key, 1);
  return 0;
};

const eraseKey = (key, contents) => {
  if (!contents.has(key) || contents.get(key) !== 1) {
    return contents.set(key, +contents.get(key) - 1 || -1).get(key);
  }

  contents.delete(key);
  return 0;
};

const initNode = (path = "", contents = new Map()) => ({ path, contents });

const Directory = createContext(initNode("", new Map()));
const Watcher = createContext((type, payload) => {
  if (payload && payload.warn) {
    console.warn(type, payload.warn);
  }
});

const noop = (type, payload) => {
  type;
  payload;
};

const useSubdir = key => {
  const parent = useContext(Directory);
  const { current } = useRef({
    node: initNode(parent.path, null),
    callback: noop
  });
  const subpath =
    key === "" || key === "." ? parent.path : parent.path + key + "/";

  current.callback = useContext(Watcher) || noop;

  current.node =
    subpath === current.node.path
      ? current.node
      : initNode(subpath, current.node.contents || new Map());

  useEffect(() => {
    if (key === "" || key === ".") {
      return;
    }

    const err = writeKey(key, parent.contents);
    const handle = current.callback;
    if (typeof handle === "function") {
      handle("onWrite", err ? { warn: "path conflict" } : null);
    }

    return () => {
      const fault = eraseKey(key, parent.contents);
      // TODO: consider using current handle instead of cached handle
      if (typeof handle === "function") {
        handle("onErase", fault ? { warn: "path corruption" } : null);
      }
    };
  }, [key, parent.contents]);

  return current.node;
};

// TODO: validate the utility of the following APIs
// const splitPath = (path = "") => path.split("/");
// const joinPath = (steps = [""]) => steps.join("/");
// const splitStep = (step = "") => step.split(".");
// const joinStep = (texts = [""]) => texts.join(".");
// const splitBoth = (path = "") => splitPath(path).map(splitStep);
// const joinBoth = (value = [[""]]) => joinPath(value.map(joinStep));

export const Folder = props => {
  const { name = "", ext = "", children } = props;
  const key = initKey(name, ext);
  const node = useSubdir(key);

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

    return key === "." ? (
      <Component {...props} />
    ) : (
      <Folder name={folder} ext={group}>
        <Component {...props} />
      </Folder>
    );
  };
};

export const usePWD = () => useContext(Directory).path;

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

export const Monitor = props => {
  const { watch, children } = props;

  return <Watcher.Provider value={watch}>{children}</Watcher.Provider>;
};
