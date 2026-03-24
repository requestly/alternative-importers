import { modheaderImporter } from "..";
import profile1 from "./inputs/profile_1.json";
import profile2 from "./inputs/Profile-test.json";

// TODO: Improve this process. This is a temporary solution to test the import process.
const testImportModheader = () => {
  const output = modheaderImporter(profile2);
  // TODO: Add assertions to validate the output.
  console.log("Output:", JSON.stringify(output, null, 2));
};

testImportModheader();
