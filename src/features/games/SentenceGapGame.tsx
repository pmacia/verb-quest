import { WrittenRecallExercise, QuizGame, type GameProps } from './exercises';
export function SentenceGapGame(props: GameProps) {
  return props.question.options.length ? (
    <QuizGame {...props} />
  ) : (
    <WrittenRecallExercise {...props} />
  );
}
