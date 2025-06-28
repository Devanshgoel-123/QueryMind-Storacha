"use client";
import React, { useEffect, useState } from "react";
import { callStorachaServer } from "@/lib/storacha";
import { Button } from "../ui/button";

export default function StorachaCaller() {
  const [args, setArgs] = useState<string>("{}");
  const [data, setData] = useState<string>("");
  const [fileName, setFileName] = useState<string>("data.txt");
  const [result, setResult] = useState<any | null>(null);
  const [fetchedData, setFetchedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStoreData = async () => {
    try {
      setError(null);
      const encoded = btoa(decodeURIComponent(encodeURIComponent(data)));
      const parsedArgs = JSON.parse(args);
      const uploadArgs = { ...parsedArgs, file: encoded, name: fileName };

      const uploadRes = await callStorachaServer("upload", uploadArgs);
      console.log("Upload Result:", uploadRes);

      if (uploadRes) {
        setResult(uploadRes);
      } else {
        setError("Failed to upload data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while storing data.");
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      const fetchArgs = `${result.root["/"]}/${fileName}`;
      const fetchRes = await callStorachaServer("retrieve", { filepath: fetchArgs });
      console.log("Fetch Result:", fetchRes);

      if (fetchRes) {
        setFetchedData(fetchRes);
      } else {
        setError("Failed to retrieve data.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while retrieving data.");
    }
  };

  useEffect(() => {
    if (result) fetchData();
  }, [result]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-md space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Storacha Server Caller</h1>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">File Name:</span>
          <input
            type="text"
            className="w-full mt-1 p-2 border rounded-lg dark:bg-zinc-800 dark:text-white"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name (e.g., data.txt)"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data to Store:</span>
          <textarea
            className="w-full mt-1 p-2 border rounded-lg h-32 resize-y dark:bg-zinc-800 dark:text-white"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter the data you want to store"
          />
        </label>

        <Button className="mt-2" onClick={handleStoreData}>
          Store Data
        </Button>

        {error && <p className="text-red-500 font-medium">Error: {error}</p>}

        {result && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mt-4">Upload Result:</h2>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl overflow-auto text-sm text-zinc-800 dark:text-white">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {fetchedData && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mt-4">Fetched Data:</h2>
            <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl overflow-auto text-sm text-zinc-800 dark:text-white">
              {atob(fetchedData.data)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
