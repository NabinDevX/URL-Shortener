"use client";

export default function Analytics() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-primary rounded-full"></div>
            <h2 className="text-2xl font-extrabold tracking-tight font-headline">
              Detailed Link Performance
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-8 glass-card rounded-4xl p-8 shadow-sm border border-white/40">
          <h3 className="text-xl font-bold font-headline mb-2">
            Create New Branded Link
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            Pro users can customize the back-half and use dedicated domains.
          </p>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              className="flex-1 bg-surface-container-low rounded-xl px-4 py-3 text-sm"
              type="text"
              defaultValue="https://example.com/very-long-product-campaign-url-2024"
            />
            <button className="h-11.5 bg-linear-to-tr from-primary to-primary-container text-white px-8 rounded-xl font-bold">
              Shorten Link
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-4xl p-8 shadow-sm flex flex-col items-center justify-center text-center premium-border">
          <div className="bg-surface-container-low p-6 rounded-2xl mb-4 relative">
            <span className="material-symbols-outlined text-tertiary text-5xl">
              qr_code_2
            </span>
            <div className="absolute -top-2 -right-2 bg-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              PRO
            </div>
          </div>
          <h4 className="font-bold mb-1">Live QR Generation</h4>
          <p className="text-xs text-on-surface-variant">
            Real-time QR tracking for print campaigns
          </p>
        </div>

        <div className="relative col-span-12 overflow-hidden rounded-[2.5rem] bg-surface-container-low p-6 sm:p-8 lg:p-10">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold font-headline leading-tight">
                Click Distribution
              </h3>
              <p className="text-on-surface-variant">
                Global performance over the past 30 days
              </p>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-end">
                <span className="text-3xl font-extrabold text-primary">
                  124.8k
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  +12% vs last month
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-80 flex items-end gap-3 px-4">
            {[40, 65, 85, 55, 45, 30, 70, 50, 40, 35, 60, 45].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-xl ${i === 2 ? "bg-primary" : i === 6 ? "bg-tertiary/60" : "bg-surface-container-highest"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="col-span-12 overflow-hidden rounded-4xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            <h3 className="font-bold text-lg font-headline">
              Recent Link Activity
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">
              Displaying 24 of 1,240 links
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Short URL
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
                    Total Clicks
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Device
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                <tr className="hover:bg-surface-bright transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-primary">
                    shrt.ly/winter-sale
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-bold">
                    12,450
                  </td>
                  <td className="px-8 py-5 text-sm">iOS / iPhone</td>
                  <td className="px-8 py-5 text-sm">San Francisco, US</td>
                </tr>
                <tr className="hover:bg-surface-bright transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-primary">
                    shrt.ly/bio-link
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-bold">
                    8,912
                  </td>
                  <td className="px-8 py-5 text-sm">MacOS / Chrome</td>
                  <td className="px-8 py-5 text-sm">London, UK</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
