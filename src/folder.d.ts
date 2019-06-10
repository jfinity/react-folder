import { ComponentType, ReactNode } from "react";

type DirName = string;
type DirId = any | string | number;

export const Folder: ComponentType<{
  name?: DirName;
  children?: ReactNode | (({ path }: { path: string }) => ReactNode);
}>;
export function mkDir<P>(
  LOC: ComponentType<P>
): ComponentType<P & { folder?: DirName }>;
export function useCWDRef(): () => null | string;

export function createSystem(options?: {
  separator?: string;
  useFinalId?: () => DirId;
  logWarning?: typeof console.log;
}): [typeof Folder, typeof mkDir, typeof useCWDRef];
