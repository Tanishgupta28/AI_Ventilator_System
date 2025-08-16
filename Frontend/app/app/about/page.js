"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchAboutData = async () => {
  const response = await axios.get("/api/about");
  return response.data;
};

export default function About() {
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: "aboutData",
    queryFn: fetchAboutData,
  });
  return (
    <div>
      <h1 className="text-3xl font-bold">About Us</h1>
      {isLoading && <p>Loading...</p>}
      <button onClick={() => refetch()}>
        {isFetching ? "Refreshing..." : "Refresh"}
      </button>
      {error && <p>Error fetching about data</p>}
      {data && <p>{data.description}</p>}
    </div>
  );
}
