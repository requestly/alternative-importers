import React, { useEffect } from "react";
import { parseRulesFromModheader } from "../../rule-adapters/parseRulesFromModHeader";

interface ImportFromModHeaderProps {
  filePath: string;
}

export const ImportFromModHeader: React.FC<ImportFromModHeaderProps> = ({
  filePath,
}) => {
  //TODO: fix this any type
  //const [parsedRules, setParsedRules] = useState<any[]>([]);
  useEffect(() => {
    const processFile = async () => {
      let parsedRules = [];
      let modHeaderProfilesJson;

      try {
        const filefetched = await fetch(filePath);
        if (!filefetched) {
          throw new Error("Failed to fetch the file");
        }
        const fileContent = await filefetched.text();
        modHeaderProfilesJson = JSON.parse(fileContent);
        //console.log("ModHeaderProfile", modHeaderProfilesJson);
        parsedRules = parseRulesFromModheader(modHeaderProfilesJson);
        console.log("Parsed Rules", parsedRules);
        //setParsedRules(parsed);
        //console.log("Parsed Rules", JSON.stringify(parsedRules,null, 2));
      } catch (e) {
        throw new Error("Failed to parse your ModHeader File" + e);
      }
    };
    processFile();
  }, [filePath]);

  // const downloadParsedRules = () => {
  //   const blob = new Blob([JSON.stringify(parsedRules, null, 2)], {
  //     type: "application/json",
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = "parsedRules.json";
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // };

  return (
    <>
      <p>Importer</p>
      {/* {parsedRules.length > 0 && (
        <button onClick={downloadParsedRules}>Download Parsed Rules</button>
      )} */}
    </>
  );
};
