import React, { createContext, useRef, useContext, useEffect } from "react";

const WarningCode = {
  UnfoundClaim: 1 << 0,
  ContestedClaim: 1 << 1,
  ClaimCorruption: 1 << 2
};

const logNothing = () => {};

class Meta {
  claims = new Map();

  reclaim(before = "", after = "", logWarning = logNothing, path = "") {
    const { claims } = this;
    const prior = claims.get(before) || 0;
    const next = claims.get(after) || 0;
    let warning = 0;

    if (before !== after) {
      if (prior > 0) {
        if (prior === 1) {
          claims.delete(before);
        } else {
          claims.set(before, prior - 1);
        }
      } else if (before !== "") {
        warning |= WarningCode.UnfoundClaim;
        logWarning("Cannot restore unfound claim: " + before, path);
      }

      if (after !== "") {
        claims.set(after, next + 1);
        if (next > 0) {
          warning |= WarningCode.ContestedClaim;
          logWarning("Contested claim: " + after, path);
        } else if (next < 0) {
          warning |= WarningCode.ClaimCorruption;
          logWarning("Corrupt claim" + after, path);
        }
      }
    }

    return warning;
  }
}

const useFinalMeta = () => {
  const ref = useRef(null);
  ref.current = ref.current || new Meta();
  return ref.current;
};

let idCounter = 0;
const useFinalCommonId = () => {
  const ref = useRef(null);
  ref.current = ref.current || --idCounter;
  return ref.current;
};

const logRed = (...args) => {
  console.error(...args);
};

export const createSystem = ({
  separator = "__",
  useFinalId = useFinalCommonId,
  logWarning = logRed
} = {}) => {
  const Directory = createContext({
    name: "",
    id: null,
    path: separator,
    meta: new Meta()
  });

  const Folder = props => {
    const { name = "", children } = props;

    const id = useFinalId();
    const meta = useFinalMeta();
    const subdir = useCWDKey(name) + (name === "" ? "" : name + separator);
    const ref = useRef(null);
    let { current: cached = null } = ref;

    // TODO: consider signalling changes through callback props

    if (typeof name !== "string") {
      throw new Error("Folder name must be a string");
    } else if (name.indexOf(separator) > -1) {
      throw new Error(
        "Folder name forbids separator: " + separator + " ( " + name + " )"
      );
    }

    if (!cached || cached.path !== subdir || cached.name !== name) {
      cached = {
        name,
        id,
        path: subdir,
        meta
      };
    }

    ref.current = cached;

    return (
      <Directory.Provider value={ref.current}>
        {typeof children === "function" ? children({ path: subdir }) : children}
      </Directory.Provider>
    );
  };

  const useCWDKey = (key = "") => {
    const parent = useContext(Directory);

    useEffect(() => {
      parent.meta.reclaim("", key, logWarning, parent.path);

      return () => {
        parent.meta.reclaim(key, "", logWarning, parent.path);
      };
    }, [key, parent.meta]); // NOTE: parent.path is excluded

    return parent.path;
  };

  const useCWDRef = () => {
    const dir = useContext(Directory);
    const ref = useRef(null);

    ref.current = ref.current || {
      path: dir ? dir.path : null,
      working: () => ref.current.path
    };

    ref.current.path = dir ? dir.path : null;

    return ref.current.working;
  };

  const mkDir = Component => props => {
    const { folder = "" } = props;
    return folder === "" ? (
      <Component {...props} />
    ) : (
      <Folder name={folder}>
        <Component {...props} />
      </Folder>
    );
  };

  // TODO: consider adding state management with Files
  // const useFiles = () => {}

  return [Folder, mkDir, useCWDRef];
};

export const [Folder, mkDir, useCWDRef] = createSystem();
