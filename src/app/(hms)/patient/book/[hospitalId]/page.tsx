import DoctorSelector from "@/components/hms/DoctorSelector";

export default async function ChooseDoctorPage({
  params,
}: {
  params: Promise<{ hospitalId: string }>;
}) {
  const { hospitalId } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choose Your Doctor</h1>
      <DoctorSelector hospitalId={hospitalId} />
    </div>
  );
}