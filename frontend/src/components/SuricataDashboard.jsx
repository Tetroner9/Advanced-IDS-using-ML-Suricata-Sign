import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X, AlertCircle, FileText, Activity } from 'lucide-react';
// import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const SuricataDashboard = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Simulated processing function (in a real app, this would call your Python backend)
  // Replace the mock processFile function with this real API call:
  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Make actual API call to your backend
      const response = await axios.post('http://localhost:5000/api/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set results from actual backend processing
      setResults(response.data);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.response?.data?.error || "Failed to process the file. Please check the format and try again.");
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.json')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid eve.json file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.json')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid eve.json file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const resetDashboard = () => {
    setFile(null);
    setResults(null);
    setError(null);
  };

  // Calculate percentages for the visualization
  const getPercentage = (count) => {
    if (!results) return 0;
    return (count / results.totalProcessed) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Suricata ML Integration Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Upload an eve.json file to analyze network traffic with the ML model
          </p>
        </header>

        {!results ? (
          <div 
            className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="mb-6">
              <Upload className="w-16 h-16 mx-auto text-blue-500" />
            </div>
            
            <h2 className="text-xl mb-4 font-medium">Upload EVE JSON Log File</h2>
            <p className="text-gray-400 mb-6">
              Drag and drop your eve.json file here or click to browse
            </p>
            
            <input 
              type="file" 
              id="fileUpload" 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            
            <label 
              htmlFor="fileUpload" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer inline-block"
            >
              Select File
            </label>
            
            {file && (
              <div className="mt-6 flex items-center justify-center text-left p-4 bg-gray-800 rounded-md">
                <FileText className="text-blue-400 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}
            
            <button
              onClick={processFile}
              disabled={!file || isProcessing}
              className={`mt-6 px-8 py-3 rounded-md ${
                !file || isProcessing 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Run Analysis'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg col-span-1">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="mr-2 text-blue-400" />
                Prediction Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Entries:</span>
                  <span className="font-bold">{results.totalProcessed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg. Probability:</span>
                  <span className="font-bold">{results.avgProbability.toFixed(4)}</span>
                </div>
              </div>
              <button 
                onClick={resetDashboard}
                className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Analyze Another File
              </button>
            </div>
            
            {/* Classification Distribution */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg col-span-2">
              <h2 className="text-xl font-semibold mb-4">Classification Distribution</h2>
              <div className="space-y-6">
              {Object.entries(results.classCounts).map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className={`
                      ${label === 'Normal Traffic' ? 'text-green-400' : ''}
                      ${label === 'DoS' ? 'text-yellow-400' : ''}
                      ${label === 'Port Scan' ? 'text-orange-400' : ''}
                      ${label === 'DDoS' ? 'text-red-400' : ''}
                      ${label === 'Ping Attack' ? 'text-blue-400' : ''}
                      ${label === 'Malware' ? 'text-purple-400' : ''}
                      ${label === 'DNS Abuse' ? 'text-pink-400' : ''}
                      ${label === 'Fake DNS' ? 'text-indigo-400' : ''}
                      ${label === 'SQL Injection' ? 'text-rose-400' : ''}
                    `}>
                      {label}
                    </span>
                    <span>{count} ({(count / results.totalProcessed * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        label === 'Normal Traffic' ? 'bg-green-400' : 
                        label === 'DoS' ? 'bg-yellow-400' : 
                        label === 'Port Scan' ? 'bg-orange-400' : 
                        label === 'DDoS' ? 'bg-red-400' :
                        label === 'Ping Attack' ? 'bg-blue-400' :
                        label === 'Malware' ? 'bg-purple-400' :
                        label === 'DNS Abuse' ? 'bg-pink-400' :
                        label === 'Fake DNS' ? 'bg-indigo-400' :
                        label === 'SQL Injection' ? 'bg-rose-400' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${getPercentage(count)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              </div>
            </div>
            
            {/* Recent Entries Table */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg col-span-3">
              <h2 className="text-xl font-semibold mb-4">Recent Log Entries</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Source IP</th>
                      <th className="pb-3">Destination IP</th>
                      <th className="pb-3">Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recentEntries.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-3">{new Date(entry.timestamp).toLocaleString()}</td>
                        <td className="py-3">{entry.src_ip}</td>
                        <td className="py-3">{entry.dest_ip}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                          <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                            <div 
                              className={`h-1.5 rounded-full ${
                                entry.prediction === 'Normal Traffic' ? 'bg-green-400' : 
                                entry.prediction === 'DoS' ? 'bg-yellow-400' : 
                                entry.prediction === 'Port Scan' ? 'bg-orange-400' : 
                                entry.prediction === 'DDoS' ? 'bg-red-400' :
                                entry.prediction === 'Ping Attack' ? 'bg-blue-400' :
                                entry.prediction === 'Malware' ? 'bg-purple-400' :
                                entry.prediction === 'DNS Abuse' ? 'bg-pink-400' :
                                entry.prediction === 'Fake DNS' ? 'bg-indigo-400' :
                                entry.prediction === 'SQL Injection' ? 'bg-rose-400' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${entry.probability * 100}%` }}
                            ></div>
                          </div>
                            {entry.probability.toFixed(4)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuricataDashboard;