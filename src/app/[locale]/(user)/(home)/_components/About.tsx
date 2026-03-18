import Image from "next/image"
//simple
export const About = () => {
  return (
    <div className="py-8 sm:py-20">
      <div className="container">
        <h2 className="t-h2 mb-8 w-full pb-6 pl-6  text-left">About</h2>

        <div className="flex  flex-wrap items-start justify-center gap-4 md:flex-nowrap  md:justify-start md:gap-4 lg:gap-x-[136px]">
          <div className="w-max min-w-max">
            <div className="mb-6 border-b-[3px] border-l  border-r-[3px] border-t border-black bg-white p-4">
              <Image src={"/about_user.png"} width={248} height={288} alt="" />
            </div>
          </div>
          <div className="text-s md:text-m flex w-full max-w-[37rem] flex-col">
            <p className="mb-4">
              In V3V we concentrate on cutting-edge crypto and associated
              technologies, engaging in investments, development, and
              collaboration with enterprises and protocols, offering support
              ranging from $1M to over $100M.
            </p>
            <p>
              We adopt a highly involved approach to guide projects toward their
              maximum capabilities, spanning technical and operational aspects.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
