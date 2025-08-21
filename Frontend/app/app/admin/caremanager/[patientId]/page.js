"use client";
import AudioPlayer from "@/components/Audio";
import Button from "@/components/Button";
import NotifyBox from "@/components/NotifyBox";
import Profile from "@/components/Profile";
import ProfileCard from "@/components/ProfileCard";
import RealTime from "@/components/RealTime";
import Text from "@/components/Text";
import TimeTag from "@/components/TimeTag";
import { alertConfig } from "@/lib/alert";
import { calculateAge } from "@/lib/dob";
import { url } from "@/url";
import axios from "axios";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const id = patientId;
  const router = useRouter();
  const [data, setData] = useState({});
  const [length, setLength] = useState(0);

  useEffect(() => {
    async function fetchPatientDetails() {
      try {
        const response = await axios.get(`${url}/patient/${patientId}`);
        console.log(response.data.data);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching patient details:", err);
      }
    }
    fetchPatientDetails();
  }, [patientId]);

  return (
    <div className="p-6 flex-1 flex flex-col gap-6 h-screen overflow-y-auto ml-40">
      <div className="flex ml-100">
        <Image src="/lovelogo.png" alt="Add Patient" width={150} height={100} />
      </div>
      <div className="w-[900px] bg-white shadow-lg rounded-2xl flex flex-col items-center justify-start overflow-hidden">
        <Profile
          name={data?.name}
          age={data?.dob}
          bed={data?.bed}
          bool={false}
          width={900}
          iw={50}
        />
        <div className="flex items-center justify-between w-full px-4 pb-2">
          <Text size="text-2xl" bold color="text-black" font="font-sans">
            AI Voice Playback
          </Text>
          <Button
            onClick={() =>
              router.push(`/admin/caremanager/${patientId}/voice/${patientId}`)
            }
          >
            Add
          </Button>
        </div>
        <div className="flex items-center gap-4 w-full px-4 pb-2 overflow-x-auto overflow-y-hidden no-scrollbar">
          <div>
            <Text size="text-xl" bold color="text-black" font="font-sans">
              Dnger
            </Text>
            <AudioPlayer src="/first.mp3" width={250} length={7} />
          </div>
          <div>
            <Text size="text-xl" bold color="text-black" font="font-sans">
              Dnger
            </Text>
            <AudioPlayer src="/first.mp3" width={250} length={7} />
          </div>
          <div>
            <Text size="text-xl" bold color="text-black" font="font-sans">
              Dnger
            </Text>
            <AudioPlayer src="/first.mp3" width={250} length={7} />
          </div>
          <div>
            <Text size="text-xl" bold color="text-black" font="font-sans">
              Dnger
            </Text>
            <AudioPlayer src="/first.mp3" width={250} length={7} />
          </div>
          <div>
            <Text size="text-xl" bold color="text-black" font="font-sans">
              Dnger
            </Text>
            <AudioPlayer src="/first.mp3" width={250} length={7} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-between w-full">
          <div className="flex gap-6 w-full">
            <div className="flex-1 bg-white shadow-md rounded-xl px-4 py-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Add Members</h2>
                <Button height="h-10" width="w-24" onClick={() => router.push(`/admin/caremanager/${patientId}/member/${patientId}`)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-2 no-scrollbar">
                <ProfileCard
                  // imgSrc="/nurse.jpg"
                  name="Mithali Mishra"
                  role="Nurse"
                />
                <ProfileCard
                  // imgSrc="/father.jpg"
                  name="Manuel Zimmer"
                  role="Father"
                />
                <ProfileCard
                  // imgSrc="/doctor.jpg"
                  name="Dr. Roushan Sharma"
                  role="Doctor"
                />
                <ProfileCard
                  // imgSrc="/doctor.jpg"
                  name="Dr. Roushan Sharma"
                  role="Doctor"
                />
                <ProfileCard
                  // imgSrc="/doctor.jpg"
                  name="Dr. Roushan Sharma"
                  role="Doctor"
                />
                <ProfileCard
                  // imgSrc="/doctor.jpg"
                  name="Dr. Roushan Sharma"
                  role="Doctor"
                />
                <ProfileCard
                  // imgSrc="/doctor.jpg"
                  name="Dr. Roushan Sharma"
                  role="Doctor"
                />
              </div>
            </div>
            <div className="flex-1 bg-white shadow-md rounded-xl px-4 py-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Add Schedule</h2>
                <Button height="h-10" width="w-24" onClick={() => router.push(`/admin/caremanager/${patientId}/medication/${patientId}`)}>
                  Add
                </Button>
              </div>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-2 no-scrollbar">
                <TimeTag label="Vital Sign Checks" time="11:30 AM" />
                <TimeTag label="Medicine Time" time="04:00 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
                <TimeTag label="Dinner Feeding" time="08:30 PM" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
