type Props = {
  rank: number;
  name: string;
  tasks: number;
};

export default function UserRankItem({ rank, name, tasks }: Props) {
  return (
    <div className='flex items-center justify-between border-b py-4 last:border-none'>
      <div className='flex items-center gap-4'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 font-semibold text-cyan-300'>
          {rank}
        </div>

        <div>
          <h3 className='font-semibold text-zinc-100'>{name}</h3>
          <p className='text-sm text-zinc-400'>Team Member</p>
        </div>
      </div>

      <span className='font-semibold text-zinc-200'>{tasks} Tasks</span>
    </div>
  );
}
