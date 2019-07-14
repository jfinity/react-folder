import React from "react";
import { render, cleanup } from "@testing-library/react";
import "jest-dom/extend-expect";
import { Folder, mkdir, usePWD, useJournal, Monitor } from "./folder";

// automatically unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it("Should assemble full path", () => {
  const Wrapper = mkdir(null, ({ children }) => {
    const path = usePWD();
    return <span data-testid={path}>{children}</span>;
  });

  const { getByTestId } = render(
    <div>
      <Folder name="alpha">
        <Folder name="beta">
          <div>
            <div>
              <Folder>
                {testid => (
                  <div data-testid={testid} id="ALPHA-BETA">
                    <Wrapper folder="gamma">
                      <span>
                        <Folder name="delta">{content => content}</Folder>
                      </span>
                    </Wrapper>
                  </div>
                )}
              </Folder>
            </div>
            <Wrapper folder="omega">
              <Folder>
                {label => <h1 data-testid="ALPHA-OMEGA">{label}</h1>}
              </Folder>
            </Wrapper>
          </div>
        </Folder>
      </Folder>
    </div>
  );

  expect(getByTestId("alpha/beta/")).toHaveAttribute("id", "ALPHA-BETA");
  expect(getByTestId("alpha/beta/gamma/")).toHaveTextContent(
    "alpha/beta/gamma/delta/"
  );
  expect(getByTestId("ALPHA-OMEGA")).toHaveTextContent("alpha/beta/omega/");
});

it("Should support extentions/groups and action creation", () => {
  let action;
  const dispatch = (value = {}) => (action = value);

  const SomeComponent = mkdir(null, () => {
    const path = usePWD();
    const text = `["${path.replace(/\//g, '","')}"]`;
    const journal = useJournal(dispatch, "SomeComponent");

    journal("type", { data: "data" });

    if (text !== `[".git","0.d.ts","baz","1",""]`) {
      throw "this should never happen -- " + text;
    }

    return <pre>{JSON.stringify(JSON.parse(text).slice(0, -1), null, 2)}</pre>;
  });

  const Div = mkdir(null, props => <div {...props} />);

  render(
    <div>
      <div>Foo</div>
      <Div group="git">
        {
          <Folder name="0" ext="d.ts">
            [<div key="bar">Bar</div>,
            <Div key="baz" folder="baz">
              Baz
              <SomeComponent folder="1" />
            </Div>
            ]
          </Folder>
        }
      </Div>
    </div>
  );

  expect(action).toMatchObject({
    dir: ".git/0.d.ts/baz/1/",
    file: "SomeComponent",
    type: "type",
    payload: { data: "data" }
  });
});

it("Should detect naming collisions", () => {
  let action;
  const watch = (value = {}) => (action = value);

  const Div = mkdir(null, props => <div {...props} />);

  render(
    <Monitor silent watch={watch}>
      <Div folder="identical" />
      <Div folder="identical" />
    </Monitor>
  );

  expect(action).toMatchObject({
    type: "onWrite",
    payload: {
      warn: expect.anything()
    }
  });
});
