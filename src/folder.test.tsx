import React from "react";
import { render, cleanup } from "@testing-library/react";
import "jest-dom/extend-expect";
import { createSystem } from "./folder";

// automatically unmount and cleanup DOM after the test is finished.
afterEach(cleanup);

it("Should assemble full path", () => {
  const [Folder, mkDir, useCWDRef] = createSystem({ separator: "/" });

  const Wrapper = mkDir(({ children }) => {
    const cwd = useCWDRef();
    return <span data-testid={cwd()}>{children}</span>;
  });

  const { getByTestId } = render(
    <div>
      <Folder name="alpha">
        <Folder name="beta">
          <div>
            <div>
              <Folder>
                {({ path: testid }) => (
                  <div data-testid={testid} id="ALPHA-BETA">
                    <Wrapper folder="gamma">
                      <span>
                        <Folder name="delta">
                          {({ path: content }) => content}
                        </Folder>
                      </span>
                    </Wrapper>
                  </div>
                )}
              </Folder>
            </div>
            <Wrapper folder="omega">
              <Folder>
                {({ path: label }) => (
                  <h1 data-testid="ALPHA-OMEGA">{label}</h1>
                )}
              </Folder>
            </Wrapper>
          </div>
        </Folder>
      </Folder>
    </div>
  );

  expect(getByTestId("/alpha/beta/")).toHaveAttribute("id", "ALPHA-BETA");
  expect(getByTestId("/alpha/beta/gamma/")).toHaveTextContent(
    "/alpha/beta/gamma/delta/"
  );
  expect(getByTestId("ALPHA-OMEGA")).toHaveTextContent("/alpha/beta/omega/");
});
