"use client";
import React, { useEffect, useState } from "react";
import { callStorachaServer } from "@/lib/storacha";
import { Button } from "../ui/button";

export default function StorachaCaller() {
  const [args, setArgs] = useState<string>("{}"); // JSON string for arguments
  const [data, setData] = useState<string>(""); // User-provided data
  const [fileName, setFileName] = useState<string>("data.txt"); // File name for upload
  const [result, setResult] = useState<any | null>(null);
  const [fetchedData, setFetchedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStoreData = async () => {
    try {
      setError(null);

      // Encode the user-provided data
      const encoded = btoa(decodeURIComponent(encodeURIComponent(data)));

      // Prepare arguments for the server call
      const parsedArgs = JSON.parse(args);
      const uploadArgs = { ...parsedArgs, file: encoded, name: fileName };

      // Call the server to upload the data
      const uploadRes = await callStorachaServer('upload', uploadArgs);
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

      // Prepare arguments for the server call
      const fetchArgs = `${result.root['/']}/${fileName}`;

      // Call the server to retrieve the data
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
  }

  useEffect(() => {
    // Fetch data when the component mounts
    fetchData();
  }, [result]);

  return (
    <div>
      <h1>Storacha Server Caller</h1>
      <div>
        <label>
          File Name:
          <input
            type="text"
            value={fileName}
            placeholder="Enter file name (e.g., data.txt)"
          />
        </label>
      </div>
      <div>
        <label>
          Data to Store:
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Enter the data you want to store"
          />
        </label>
      </div>
      <Button onClick={handleStoreData}>Store Data</Button>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result)}</pre>
        </div>
      )}
      {fetchedData ? (
        <div>
          <h2>Result:</h2>
          <pre>{atob(fetchedData.data)}</pre>
        </div>
      ) : <></>}
    </div>
  );
}