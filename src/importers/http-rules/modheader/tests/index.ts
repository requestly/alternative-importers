import { importModheader } from "..";
import profile1 from "./inputs/profile_1.json";

// TODO: Improve this process. This is a temporary solution to test the import process.
const testImportModheader = () => {
    const output = importModheader(profile1);
    // TODO: Add assertions to validate the output.
    console.log("Output:", output);
};

testImportModheader();