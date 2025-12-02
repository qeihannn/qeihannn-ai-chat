import { Separator } from "./ui/separator";

type ThoughtMessageProps = {
  thought: string;
}

export const ThoughtMessage = (props: ThoughtMessageProps) => {
  return (
    <div>
      <span className="italic text-sm px-2 py-1 bg-secondary rounded-lg">
        AI thought:
      </span>
      <div className="p-4 relative rounded text-muted-foreground text-sm flex">
        <Separator
          orientation="vertical"
          className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[3px]"
        />
        <p className="flex-1 whitespace-pre-line">{props.thought.trim()}</p>
      </div>
    </div>
  );
};
