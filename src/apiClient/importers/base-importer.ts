import { z, ZodType } from "zod";

/**
 * I - Zod schema for input data
 * O - Output type after conversion
 */
abstract class BaseImporter<
  I extends ZodType,
  O extends any
> {

  abstract schema: I;

  canParseRecord(data: z.infer<I>) {
    return this.schema.safeParse(data).success;
  }

  safeParse(data: z.infer<I>) {
    return this.schema.safeParse(data);
  }

  parse(data: z.infer<I>) {
    return this.schema.parse(data);
  }

  abstract convert(data: z.infer<I>): Promise<O>;

  async import(data: z.infer<I>): Promise<O> {
    const parsedData = this.parse(data);
    const convertedData = await this.convert(parsedData);
    return convertedData;
  }
}

export default BaseImporter;
