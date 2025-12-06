"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import fetcher from '@/src/lib/fetcher';

interface BackendADR {
  id: number;
  rfcId: number;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  status: 'APPROVED' | 'DRAFT';
  createdAt: string;
}

export default function ADRPage() {
  const [adrs, setAdrs] = useState<BackendADR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: BackendADR['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const fetchADRs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URL}/adrs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const items = data.content || [];
      // Ensure ADRs are ordered newest -> oldest by createdAt
      items.sort((a: BackendADR, b: BackendADR) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdrs(items);
    } catch (e) {
      console.error("Failed to fetch ADRs:", e);
      setError("Failed to load ADRs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchADRs();
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Architecture Decision Records</h1>
      </div>

      {/* ADR List */}
      <div className="space-y-4">
        {isLoading && <p className="text-gray-600">Loading ADRs...</p>}
        {error && <p className="text-red-500 font-medium">{error}</p>}
        
        {!isLoading && adrs.length === 0 && !error && (
            <p className="text-gray-600">No ADRs found. Be the first to create one!</p>
        )}

        {adrs.map((adr) => {
          return (
          <Link
            key={adr.id}
            href={`/adr/${adr.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg width="131" height="96" viewBox="0 0 131 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.6">
                        <line y1="-1.50402" x2="26.6757" y2="-1.50402"
                              transform="matrix(0.72131 -0.692613 0.691627 0.722255 44.282 82.0857)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.9282" y2="-1.50402"
                              transform="matrix(0.999747 0.022497 -0.0224356 0.999748 13.9697 54.8997)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="46.6837" y2="-1.50402"
                              transform="matrix(0.671888 0.740653 -0.739738 0.672895 33.4744 15.0444)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="38.7414" y2="-1.50402"
                              transform="matrix(0.646343 -0.763047 0.762175 0.647372 74.3296 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="41.2294" y2="-1.50402"
                              transform="matrix(0.990922 0.134438 -0.134077 0.990971 76.9661 58.8589)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <line y1="-1.50402" x2="40.2477" y2="-1.50402"
                              transform="matrix(0.464978 -0.885322 0.884798 0.465975 10.0161 50.6768)" stroke="#625B71"
                              strokeOpacity="0.47" strokeWidth="3.00805"/>
                        <ellipse cx="99.3709" cy="19.7956" rx="9.22536" ry="9.23798" fill="#AEA9E8"/>
                        <ellipse cx="119.798" cy="64.2695" rx="11.2022" ry="11.2175" fill="#C4B7FF"/>
                        <ellipse cx="69.8488" cy="54.8997" rx="13.1791" ry="13.1971" fill="#5E50A4"/>
                        <ellipse cx="30.3118" cy="10.5577" rx="10.5433" ry="10.5577" fill="#A67DFF"/>
                        <ellipse cx="9.88431" cy="52.9199" rx="9.88431" ry="9.89783" fill="#6A63BF"/>
                        <ellipse cx="39.01" cy="86.5729" rx="9.22536" ry="9.23798" fill="#5658DA"/>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {adr.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {/* Using standard JS date format for simplicity */}
                  {new Date(adr.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {adr.context}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(adr.status)}`}>
                  {adr.status}
                </span>
              </div>
              </div>
          </Link>
          )
        })}
      </div>
    </div>
  )
}