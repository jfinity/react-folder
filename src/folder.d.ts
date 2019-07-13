import { ComponentType, ReactNode } from "react";

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
export function useJournal<Kind, Payload, File = string>(
  dispatch: (action: {
    dir: string;
    file: File;
    type: Kind;
    payload: Payload;
  }) => void,
  file: File
): (type: Kind, payload: Payload) => void;

export const Monitor: ComponentType<{
  watch: (type: string, payload?: any) => void;
}>;
