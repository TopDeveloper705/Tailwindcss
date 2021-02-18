import { Processor } from "../../src/lib";

const processor = new Processor();

describe("Interpretation Mode", () => {
  it("interpret", () => {
    const result = processor.interpret(
      "font-bold \n\ttext-green-300 \nsm:dark:hover:text-lg sm:(bg-gray-100 hover:bg-gray-200) abc bg-cool-gray-300 bg-hex-fff"
    );
    expect(result.ignored).toEqual(["abc"]);

    expectToMatchSnapshot(result.success, "success", __filename);
    expectToMatchSnapshot(result.styleSheet.build(), "css", __filename);

    expect(processor.interpret("test wrong css").success).toEqual([]);
    expect(processor.interpret("test wrong css").ignored).toEqual([
      "test",
      "wrong",
      "css",
    ]);
  });
});
