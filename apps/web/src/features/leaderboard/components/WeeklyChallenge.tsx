export default function WeeklyChallenge(){

    return(

        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">

            <h2 className="font-bold text-zinc-100">
                Weekly Challenge
            </h2>

            <p className="mt-3 text-sm text-zinc-300">
                Complete 20 tasks this week to earn an extra 500 points.
            </p>

            <div className="mt-5 h-3 rounded-full bg-zinc-800">

                <div className="h-full w-2/3 rounded-full bg-cyan-500"/>

            </div>

            <p className="mt-3 text-sm font-medium text-zinc-200">
                14 / 20 Completed
            </p>

        </div>

    )

}