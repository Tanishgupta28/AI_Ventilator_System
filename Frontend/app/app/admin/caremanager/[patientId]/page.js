"use client";
import AudioPlayer from "@/components/Audio";
import Button from "@/components/Button";
import Profile from "@/components/Profile";
import ProfileCard from "@/components/ProfileCard";
import Text from "@/components/Text";
import TimeTag from "@/components/TimeTag";
import { url } from "@/url";
import axios from "axios";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const router = useRouter();

  const [data, setData] = useState({});
  const [audio, setAudio] = useState([]);
  const [medications, setMedications] = useState([]);
  const [members, setMembers] = useState([]);
  // const [length, setLength] = useState(0);

  useEffect(() => {
    async function fetchPatientDetails() {
      try {
        const response = await axios.get(`${url}/patient/${patientId}`);
        setData(response.data.data);
        console.log("Patient Data:", response.data.data);
        const ares = await axios.get(`${url}/voice/${patientId}`);
        setAudio(ares.data.data || []);
        const mres = await axios.get(`${url}/medication/${patientId}`);
        console.log("Medications:", mres.data.data.medication);
        setMedications(mres.data.data.medication || []);
        const membersRes = await axios.get(
          `${url}/member/patient/${patientId}`
        );
        console.log("Members:", membersRes.data.data);
        setMembers(membersRes.data.data || []);
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
          image={data?.image}
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
          {audio.length > 0 ? (
            audio.map((voice, idx) => (
              <div
                key={voice._id || idx}
                className="flex flex-col items-center"
              >
                <Text size="text-lg" bold color="text-black" font="font-sans">
                  {voice.text || "Untitled"}
                </Text>
                <AudioPlayer
                  src={
                    voice.voice.startsWith("http")
                      ? voice.voice
                      : `https://${voice.voice}`
                  }
                  width={1000}
                  length={8}
                />
              </div>
            ))
          ) : (
            <Text size="text-sm" color="text-gray-500">
              No voice messages available
            </Text>
          )}
        </div>

        <div className="flex flex-col items-center justify-between w-full">
          <div className="flex gap-6 w-full">
            <div className="flex-1 bg-white shadow-md rounded-xl px-4 py-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Add Members</h2>
                <Button
                  height="h-10"
                  width="w-24"
                  onClick={() =>
                    router.push(
                      `/admin/caremanager/${patientId}/member/${patientId}`
                    )
                  }
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-2 no-scrollbar">
                <ProfileCard
                  key={members.doctor?.id}
                  name={members.doctor?.fullname}
                  role="Doctor"
                  image={members.doctor?.image}
                />
                {members.nurse?.length > 0 ? (
                  members.nurse.map((member) => (
                    <ProfileCard
                      key={member.id}
                      name={member.fullname}
                      role="Nurse"
                      image={member?.image}
                    />
                  ))
                ) : (
                  <Text size="text-sm" color="text-gray-500">
                    No members added yet
                  </Text>
                )}
                {members.members?.length > 0 ? (
                  members.members.map((member) => (
                    <ProfileCard
                      key={member.id}
                      name={member.fullname}
                      role={member.role}
                      imgSrc={member.image}
                    />
                  ))
                ) : (
                  <Text size="text-sm" color="text-gray-500">
                    No members added yet
                  </Text>
                )}
              </div>
            </div>

            <div className="flex-1 bg-white shadow-md rounded-xl px-4 py-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Add Schedule</h2>
                <Button
                  height="h-10"
                  width="w-24"
                  onClick={() =>
                    router.push(
                      `/admin/caremanager/${patientId}/medication/${patientId}`
                    )
                  }
                >
                  Add
                </Button>
              </div>

              {/* Scrollable Medication List */}
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-2 no-scrollbar">
                {medications.length > 0 ? (
                  medications.map((med) => {
                    const time = new Date(med.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });
                    return (
                      <TimeTag key={med._id} label={med.msg} time={time} />
                    );
                  })
                ) : (
                  <Text size="text-sm" color="text-gray-500">
                    No schedule added yet
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
