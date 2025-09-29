import DateTimePicker from "@/components/hms/DateTimePicker";

export default async function PickDateTimePage({
  params,
}: {
  params: Promise<{ hospitalId: string; doctorId: string }>;
}) {
  const { hospitalId, doctorId } = await params; // ← unwrap here

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pick Date & Time</h1>
      <DateTimePicker hospitalId={hospitalId} doctorId={doctorId} />
    </div>
  );
}