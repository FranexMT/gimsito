import RoutineDetail from "@/components/RoutineDetail";

export default async function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoutineDetail routineId={id} />;
}
