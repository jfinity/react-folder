import { ComponentType, ReactNode } from "react";

export const Monitor: ComponentType<{
  silent?: boolean,
  watch?: (action: { type?: string, payload?: any }) => void;
}>;

type KeyPart = string;

export const Folder: ComponentType<{
  name?: KeyPart;
  ext?: KeyPart;
  children?:
    | ReactNode
    | ((path: string, name: KeyPart, ext: KeyPart) => ReactNode);
}>;

export function mkdir<Props>(
  options: { name?: KeyPart; ext?: KeyPart } | null | undefined,
  LOC: ComponentType<Props>
): ComponentType<Props & { folder?: KeyPart; group?: KeyPart }>;

export function usePWD(): string;
