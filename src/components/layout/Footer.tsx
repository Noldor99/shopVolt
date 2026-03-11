const links = [
  {
    label: "Investor Inquiries",
    url: "mailto:example@mail.com",
    urlLabel: "example@mail.com",
  },
  {
    label: "Investor Inquiries",
    url: "mailto:example@mail.com",
    urlLabel: "example@mail.com",
  },
]

export const Footer = () => {
  return (
    <footer className="bg-white">
      <section className="container py-[40px]">
        <div className="flex flex-col">
          <h3 className="t-lg2 mb-8 w-full border-b border-[#F0F0F0] pb-6 text-left">Contact</h3>

          <div className="flex w-full flex-wrap items-start justify-between gap-2">
            <div className="flex w-full flex-col items-start justify-start md:w-1/2">
              <p className="t-lg1 md:text-h3 mb-6">Privacy is our paramount</p>
              {links.map(({ label, url, urlLabel }, index) => (
                <div
                  className="flex w-full max-w-[560px] flex-col flex-wrap items-start justify-between md:flex-row md:flex-nowrap md:gap-x-8"
                  key={index}
                >
                  <p className="t-sm1 w-full max-w-[280px] whitespace-nowrap text-left">{label}</p>
                  <a
                    className="t-sm1 w-full max-w-[280px] text-left underline underline-offset-2"
                    href={url}
                  >
                    {urlLabel}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </footer>
  )
}
