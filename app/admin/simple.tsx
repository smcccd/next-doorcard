"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SimpleAdminPage() {
  const { data: session, status } = useSession();
  const [terms, setTerms] = useState([]);
  const [doorcards, setDoorcards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      window.location.href = "/dashboard";
      return;
    }

    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    try {
      const [termsRes, doorcardsRes] = await Promise.all([
        fetch("/api/terms"),
        fetch("/api/doorcards/admin"),
      ]);

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        setTerms(termsData);
      }

      if (doorcardsRes.ok) {
        const doorcardsData = await doorcardsRes.json();
        setDoorcards(doorcardsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage terms and oversee faculty doorcards</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium">Total Terms</h3>
            <p className="text-2xl font-bold">{terms.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium">Total Doorcards</h3>
            <p className="text-2xl font-bold">{doorcards.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium">Active Doorcards</h3>
            <p className="text-2xl font-bold">
              {doorcards.filter((d: any) => d.isActive).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-medium">Faculty Members</h3>
            <p className="text-2xl font-bold">
              {new Set(doorcards.map((d: any) => d.user?.email)).size}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Doorcards</h2>
          <div className="space-y-2">
            {doorcards.slice(0, 10).map((doorcard: any) => (
              <div key={doorcard.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <span className="font-medium">{doorcard.doorcardName}</span>
                  <span className="text-gray-500 ml-2">
                    {doorcard.term} {doorcard.year}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  doorcard.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {doorcard.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}