import { notFound } from "next/navigation";
import { getExerciseById } from "@/lib/exercises";
import ExerciseDetail from "@/components/ExerciseDetail";

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = getExerciseById(id);
  if (!exercise) notFound();

  return <ExerciseDetail exercise={exercise} />;
}
