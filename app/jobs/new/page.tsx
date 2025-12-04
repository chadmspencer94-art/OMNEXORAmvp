import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">New Job</h1>
        <p className="mt-2 text-slate-600">Create a new AI-powered job pack for your client.</p>
      </div>

      {/* Form Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="space-y-6">
            {/* Client Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client Email
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    disabled
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Property Address
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main St, Sydney NSW 2000"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-white"
                    disabled
                  >
                    <option>Interior Painting</option>
                    <option>Exterior Painting</option>
                    <option>Full House Repaint</option>
                    <option>Commercial Painting</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the job in detail. Include room sizes, surfaces to be painted, any prep work needed, etc."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none"
                    disabled
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated Area (m²)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Rooms
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-slate-500">
                  This will use <span className="font-semibold">1 credit</span> to generate the job pack.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/jobs"
                    className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Generate Job Pack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Job creation form coming soon. Form fields are currently disabled.
      </p>
    </div>
  );
}

