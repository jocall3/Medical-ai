import React, { useState } from 'react';
import { useRadiology } from '../context/RadiologyContext';

export const StudyMetadata: React.FC = () => {
  const { state } = useRadiology();
  const [searchQuery, setSearchQuery] = useState('');

  if (!state.metadata) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        No study metadata loaded.
      </div>
    );
  }

  const metadataFields = [
    { label: 'Patient Name', value: state.metadata.patientName },
    { label: 'Patient ID', value: state.metadata.patientId },
    { label: 'Date of Birth', value: state.metadata.patientBirthDate },
    { label: 'Sex', value: state.metadata.patientSex },
    { label: 'Study Date', value: state.metadata.studyDate },
    { label: 'Study Description', value: state.metadata.studyDescription },
    { label: 'Modality', value: state.metadata.modality },
    { label: 'Accession Number', value: state.metadata.accessionNumber },
    { label: 'Manufacturer', value: state.metadata.manufacturer },
    { label: 'Slice Thickness', value: state.metadata.sliceThickness },
    { label: 'KVP', value: `${state.metadata.kvp} kV` },
    { label: 'Exposure Time', value: `${state.metadata.exposureTime} ms` },
  ];

  const filteredFields = metadataFields.filter(
    (field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
          DICOM Header Metadata
        </h3>
        <input
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredFields.map((field, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 px-2.5 rounded bg-slate-950/40 border border-slate-800/50 hover:bg-slate-950/80 transition-colors"
          >
            <span className="text-xs text-slate-400 font-medium">{field.label}</span>
            <span className="text-xs text-slate-200 font-mono text-right max-w-[60%] truncate">
              {field.value}
            </span>
          </div>
        ))}
        {filteredFields.length === 0 && (
          <div className="text-center text-xs text-slate-600 py-4">
            No matching metadata tags found.
          </div>
        )}
      </div>
    </div>
  );
};