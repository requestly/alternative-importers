import { z, ZodType } from "zod";
import { BaseImporterOutput } from "../types";

/**
 * I - Zod schema for input data
 * O - Output Entity schema after conversion
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

  abstract convert(data: z.infer<I>): Promise<BaseImporterOutput<O>>;

  async import(data: z.infer<I>): Promise<BaseImporterOutput<O>> {
    const parsedData = this.parse(data);
    const convertedData = await this.convert(parsedData);
    return {
      data: convertedData.data,
      notSupportedFeatures: [],
      errors: [],
      warnings: [],
    };
  }
}

export default BaseImporter;
