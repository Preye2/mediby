"use client";
import { cn } from "@/lib/utils";
import { AiDoctorAgent } from "./AiDoctorAgentCard";

type props = {
  doctor: AiDoctorAgent;
  setSelectedDoctor: (doctor: AiDoctorAgent) => void;
  selectedDoctor?: AiDoctorAgent;
};

export function RecommendedDoctorCard({ doctor, setSelectedDoctor, selectedDoctor }: props) {
  return (
    <div
      className={`max-w-xs w-full group/card ${selectedDoctor === doctor ? 'bg-violet-500 rounded-md' : ''}`}
      onClick={() => setSelectedDoctor(doctor)}
    >
      <div
        className="cursor-pointer overflow-hidden relative card h-80 rounded-md shadow-xl max-w-sm mx-auto backgroundImage flex flex-col justify-between p-1 bg-cover bg-center bg-gray-100"
        style={{
          backgroundImage: `url(${doctor.image})`,
          opacity: 0.66
        }}
      >
        <div className="absolute w-full h-full top-0 left-0 bg-black/30 z-0"></div>
        <div className="flex flex-row items-center space-x-3 z-10">
          <img
            height="100"
            width="100"
            alt={doctor.name}
            src={doctor.image}
            className="h-10 w-10 rounded-full border-2 object-cover bg-gray-400 shadow-sm"
          />
          <div className="flex flex-col">
            <p className="text-[10px] text-purple-900 border bg-gray-200 rounded-md p-0.5 text-center">
              {doctor.specialty}
            </p>
          </div>
        </div>
        <div className="text content bg-black/40 p-2 rounded-md z-10">
          <h1 className="font-semibold text-md md:text-xl text-gray-50">{doctor.name}</h1>
          <p className="font-normal text-sm line-clamp-2 text-gray-50">{doctor.description}</p>
        </div>
      </div>
    </div>
  );
}
