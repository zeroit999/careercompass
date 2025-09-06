import React from "react";

const CVFileList = ({ files, onRemove, onClear }) => {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        File đã chọn: <span className="ml-1">{files.length}</span>
      </h4>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {files.map((file, idx) => (
          <div
            key={file.name + file.size}
            className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between transition-all hover:shadow-md"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-red-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
      >
        🗑️ Xóa tất cả file
      </button>
    </div>
  );
};

export default CVFileList;
