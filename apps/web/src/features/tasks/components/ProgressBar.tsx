type Props = {
  progress: number;
};

export default function ProgressBar({ progress }: Props) {
  return (
    <div className='mt-4'>
      <div className='h-2 rounded-full bg-zinc-700'>
        <div
          className='h-2 rounded-full bg-orange-700 transition-all'
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}
