import React from 'react';

const CC_PERCENTAGE = 0.0399;

// Keep in sync with the Family Plan entries in TIERS below — both are read at runtime.
const FAMILY_RATES = { jiujitsu: 400, kickboxing: 400, combined: 450 };

const TIERS = [
  // Jiu Jitsu Tiers
  { name: 'Jiu Jitsu Standard', monthlyPrice: 185, enrollmentFee: 199, hasCCDiscount: true, program: 'jiujitsu', type: 'monthly' },
  { name: 'Jiu Jitsu Premium', monthlyPrice: 220, enrollmentFee: 0, hasCCDiscount: false, program: 'jiujitsu', type: 'monthly' },
  { name: 'Jiu Jitsu Family Plan', monthlyPrice: 400, enrollmentFee: 0, hasCCDiscount: false, program: 'jiujitsu', type: 'family' },
  { name: 'Jiu Jitsu 6-Month Plan', totalPrice: 997, program: 'jiujitsu', type: 'prepaid', months: 6 },
  { name: 'Jiu Jitsu 12-Month Plan', totalPrice: 1797, program: 'jiujitsu', type: 'prepaid', months: 12 },
  // Kickboxing Tiers
  { name: 'Kickboxing Standard', monthlyPrice: 165, enrollmentFee: 199, hasCCDiscount: true, program: 'kickboxing', type: 'monthly' },
  { name: 'Kickboxing Premium', monthlyPrice: 200, enrollmentFee: 0, hasCCDiscount: false, program: 'kickboxing', type: 'monthly' },
  { name: 'Kickboxing Family Plan', monthlyPrice: 400, enrollmentFee: 0, hasCCDiscount: false, program: 'kickboxing', type: 'family' },
  { name: 'Kickboxing 6-Month Plan', totalPrice: 900, program: 'kickboxing', type: 'prepaid', months: 6 },
  { name: 'Kickboxing 12-Month Plan', totalPrice: 1500, program: 'kickboxing', type: 'prepaid', months: 12 },
  // Combined Program Tiers
  { name: 'Combined Standard', monthlyPrice: 220, enrollmentFee: 199, hasCCDiscount: true, program: 'combined', type: 'monthly' },
  { name: 'Combined Premium', monthlyPrice: 245, enrollmentFee: 0, hasCCDiscount: false, program: 'combined', type: 'monthly' },
  { name: 'Combined Family Plan', monthlyPrice: 450, enrollmentFee: 0, hasCCDiscount: false, program: 'combined', type: 'family' },
  { name: 'Combined 6-Month Plan', totalPrice: 1399, program: 'combined', type: 'prepaid', months: 6 },
  { name: 'Combined 12-Month Plan', totalPrice: 2299, program: 'combined', type: 'prepaid', months: 12 },
];

function App() {
  const [selectedTier, setSelectedTier] = React.useState(null);
  const [enrollmentDiscount, setEnrollmentDiscount] = React.useState('');
  const [daysLeft, setDaysLeft] = React.useState(0);
  const [totalDaysInMonth, setTotalDaysInMonth] = React.useState(0);
  const [numberOfPeople, setNumberOfPeople] = React.useState(1);
  const [darkMode, setDarkMode] = React.useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [percentageDiscount, setPercentageDiscount] = React.useState('');
  const [showMilitaryDiscount, setShowMilitaryDiscount] = React.useState(false);
  const [showEnrollmentDiscount, setShowEnrollmentDiscount] = React.useState(false);

  // Load saved discount only when selecting a monthly plan with enrollment fee
  React.useEffect(() => {
    if (selectedTier?.type === 'monthly' && selectedTier?.enrollmentFee > 0) {
      const savedDiscount = localStorage.getItem('lastDiscount');
      if (savedDiscount) {
        setEnrollmentDiscount(savedDiscount);
      }
    }
  }, [selectedTier]);

  // Listen for system dark mode changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setDarkMode(mediaQuery.matches);
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  React.useEffect(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    setDaysLeft(remainingDays);
    setTotalDaysInMonth(lastDayOfMonth.getDate());
  }, []);

  const calculateProratedAmount = (monthlyPrice) => {
    if (!monthlyPrice) return 0;
    const dailyRate = Number((monthlyPrice / totalDaysInMonth).toFixed(10));
    const proratedAmount = dailyRate * daysLeft;
    return proratedAmount;
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setEnrollmentDiscount(value);
    }
  };

  const calculatePercentageDiscount = (amount) => {
    if (!percentageDiscount) return 0;
    return (Number(percentageDiscount) / 100) * amount;
  };

  // Family mode is either the explicit Family Plan tier OR a monthly tier with 3+ people.
  // Prepaid plans use their own multi-person logic (1st person full + 20% off each additional).
  const isFamilyMode = (tier) => {
    if (!tier) return false;
    if (tier.type === 'family') return true;
    return tier.type === 'monthly' && numberOfPeople >= 3 && FAMILY_RATES[tier.program] != null;
  };

  const getEffectiveMonthlyPrice = (tier) => {
    if (!tier) return 0;
    if (tier.type === 'family') return tier.monthlyPrice;
    if (isFamilyMode(tier)) return FAMILY_RATES[tier.program];
    return tier.monthlyPrice;
  };

  const getDiscountedEnrollmentFee = (tier) => {
    if (!tier || !tier.enrollmentFee) return 0;
    // Family mode (explicit or implicit) waives the enrollment fee
    if (isFamilyMode(tier)) return 0;

    const originalFee = tier.enrollmentFee;
    const flatDiscount = enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount);

    return Math.max(0, originalFee - flatDiscount);
  };

  const calculateEnrollmentChargeAmount = (enrollmentAmount, hasCCDiscount) => {
    if (!hasCCDiscount) return enrollmentAmount;
    return enrollmentAmount / (1 - CC_PERCENTAGE);
  };

  const calculateMembershipCCFee = (amount) => {
    return amount * CC_PERCENTAGE;
  };

  const formatOptionLabel = (tier) => {
    if (tier.type === 'monthly' || tier.type === 'family') {
      return `${tier.name} - $${tier.monthlyPrice}/month`;
    } else {
      const actualCharge = tier.totalPrice / (1 - CC_PERCENTAGE);
      const ccFee = actualCharge - tier.totalPrice;
      return `${tier.name} - $${tier.totalPrice} (We cover $${formatPrice(ccFee)} in fees)`;
    }
  };

  // Auto-swap to the explicit Family Plan tier when N>=3 on a monthly tier.
  // The dropdown selection visibly switches; the user can pick a monthly tier again
  // to start over (we reset N to 1 in the select onChange so it doesn't immediately re-swap).
  React.useEffect(() => {
    if (selectedTier?.type === 'monthly' && numberOfPeople >= 3 && FAMILY_RATES[selectedTier.program] != null) {
      const familyTier = TIERS.find(t => t.type === 'family' && t.program === selectedTier.program);
      if (familyTier) setSelectedTier(familyTier);
    }
  }, [selectedTier, numberOfPeople]);

  const getBreakdown = (tier) => {
    if (!tier) return null;

    if (tier.type === 'prepaid') {
      const pricePerAdditional = tier.totalPrice * 0.8;
      const additionalPeople = Math.max(0, numberOfPeople - 1);
      const baseTotal = tier.totalPrice + pricePerAdditional * additionalPeople;
      const actualCharge = baseTotal / (1 - CC_PERCENTAGE);
      const ccFee = actualCharge - baseTotal;
      return {
        isPrepaid: true,
        months: tier.months,
        firstPersonPrice: tier.totalPrice,
        pricePerAdditional,
        additionalPeople,
        additionalTotal: pricePerAdditional * additionalPeople,
        baseTotal,
        customerPays: baseTotal,
        gymReceives: baseTotal - ccFee,
        actualCharge,
        ccFee,
        effectiveMonthly: baseTotal / tier.months,
        totalCharge: baseTotal,
      };
    }

    const isFamilyPlan = isFamilyMode(tier);
    const adjustedMonthlyPrice = getEffectiveMonthlyPrice(tier);
    const baseAmount = isFamilyPlan ? adjustedMonthlyPrice : adjustedMonthlyPrice * numberOfPeople;
    const membershipDiscount = calculatePercentageDiscount(baseAmount);
    const discountedAmount = baseAmount - membershipDiscount;
    
    const proratedAmount = calculateProratedAmount(discountedAmount);
    const finalEnrollmentFee = getDiscountedEnrollmentFee(tier);
    
    const membershipCCFee = calculateMembershipCCFee(proratedAmount);
    const totalMembershipCharge = proratedAmount + membershipCCFee;

    const enrollmentChargeAmount = finalEnrollmentFee - (finalEnrollmentFee * CC_PERCENTAGE);
    const enrollmentCCFee = finalEnrollmentFee * CC_PERCENTAGE;

    const monthlyTotal = discountedAmount;

    return {
      isPrepaid: false,
      proratedAmount,
      membershipCCFee,
      totalMembershipCharge,
      finalEnrollmentFee,
      enrollmentChargeAmount,
      enrollmentCCFee,
      totalCharge: totalMembershipCharge + enrollmentChargeAmount,
      adjustedMonthlyPrice: monthlyTotal,
      numberOfPeople,
      isFamilyPlan,
      membershipDiscount,
      baseAmount,
      discountedAmount
    };
  };

  const formatPrice = (amount) => {
    return Number(amount).toFixed(2);
  };

  const bgColor = darkMode ? 'bg-black' : 'bg-neutral-100';
  const cardBg = darkMode ? 'bg-neutral-950' : 'bg-white';
  const inputBg = darkMode ? 'bg-black' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-black';
  const mutedText = darkMode ? 'text-neutral-400' : 'text-neutral-500';
  const borderColor = darkMode ? 'border-white' : 'border-black';
  const subtleBorder = darkMode ? 'border-neutral-800' : 'border-neutral-200';
  const labelClass = `block text-[11px] font-bold uppercase tracking-[0.15em] mb-2 ${mutedText}`;
  const inputClass = `w-full p-3 border-2 ${borderColor} ${inputBg} ${textColor} font-medium focus:outline-none focus:ring-2 focus:ring-gracie-red`;

  const renderPeopleInput = () => (
    <div className="mb-6">
      <label className={labelClass}>Number of People</label>
      <div className="flex items-center">
        <button
          onClick={() => setNumberOfPeople(prev => Math.max(1, prev - 1))}
          className={`w-9 h-9 flex items-center justify-center border-2 ${borderColor} ${inputBg} ${textColor} font-black text-base hover:bg-gracie-red hover:text-white hover:border-gracie-red transition-colors`}
          type="button"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="1"
          value={numberOfPeople}
          onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
          className={`w-12 h-9 border-y-2 border-x-0 text-center font-bold text-sm ${borderColor} ${inputBg} ${textColor} focus:outline-none`}
          style={{ appearance: 'textfield' }}
        />
        <button
          onClick={() => setNumberOfPeople(prev => prev + 1)}
          className={`w-9 h-9 flex items-center justify-center border-2 ${borderColor} ${inputBg} ${textColor} font-black text-base hover:bg-gracie-red hover:text-white hover:border-gracie-red transition-colors`}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );

  const renderEnrollmentDiscountCheckbox = () => (
    <div className="mb-6">
      <label className="flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showEnrollmentDiscount}
          onChange={(e) => {
            setShowEnrollmentDiscount(e.target.checked);
            if (e.target.checked) {
              setEnrollmentDiscount(String(selectedTier?.enrollmentFee ?? ''));
            } else {
              setEnrollmentDiscount('');
            }
          }}
          className="mr-3 w-5 h-5 accent-gracie-red"
        />
        <span className="text-xs font-bold uppercase tracking-[0.1em]">Add Enrollment Fee Discount</span>
      </label>
    </div>
  );

  const renderMilitaryDiscountCheckbox = () => (
    <div className="mb-6">
      <label className="flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showMilitaryDiscount}
          onChange={(e) => {
            setShowMilitaryDiscount(e.target.checked);
            setPercentageDiscount(e.target.checked ? '20' : '');
          }}
          className="mr-3 w-5 h-5 accent-gracie-red"
        />
        <span className="text-xs font-bold uppercase tracking-[0.1em]">Add Military Discount</span>
      </label>
    </div>
  );

  const renderPercentageDiscountInput = () => (
    <div className="mb-6">
      <label className={labelClass}>Military Discount Percentage</label>
      <div className="flex items-center space-x-3">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          value={percentageDiscount}
          onChange={(e) => setPercentageDiscount(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
          className={`w-24 p-3 border-2 ${borderColor} ${inputBg} ${textColor} font-bold text-center focus:outline-none focus:ring-2 focus:ring-gracie-red`}
          placeholder="20"
        />
        <span className="font-bold text-lg">%</span>
      </div>
      <p className={`text-[11px] uppercase tracking-widest mt-2 ${mutedText}`}>Applied to the membership fee.</p>
    </div>
  );

  const renderMonthlyBreakdown = () => {
    const breakdown = getBreakdown(selectedTier);
    const isFamilyPlan = isFamilyMode(selectedTier);

    return (
      <div className="pb-4 space-y-1.5">
        <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${mutedText} pb-2`}>Membership Charges</div>
        <div className="flex justify-between">
          <span>Monthly Price {isFamilyPlan ? '(Family Total)' : 'per Person'}:</span>
          <span className="font-semibold tabular-nums">${formatPrice(isFamilyPlan ? getEffectiveMonthlyPrice(selectedTier) : selectedTier.monthlyPrice)}</span>
        </div>

        {!isFamilyPlan && numberOfPeople > 1 && (
          <>
            <div className="flex justify-between">
              <span>Number of People:</span>
              <span className="font-semibold tabular-nums">×{numberOfPeople}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Subtotal:</span>
              <span className="font-semibold tabular-nums">${formatPrice(breakdown?.adjustedMonthlyPrice)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <span>Daily Rate ({totalDaysInMonth}-day month):</span>
          <span className="font-semibold tabular-nums">${formatPrice(breakdown?.adjustedMonthlyPrice / totalDaysInMonth)}/day</span>
        </div>

        <div className="flex justify-between">
          <span>Days Left in Month:</span>
          <span className="font-semibold tabular-nums">{daysLeft} days</span>
        </div>

        {percentageDiscount && (
          <div className="flex justify-between text-gracie-red font-bold">
            <span>Military Discount ({percentageDiscount}%):</span>
            <span className="tabular-nums">−${formatPrice(breakdown?.membershipDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Prorated Amount{!isFamilyPlan && numberOfPeople > 1 ? ' (All People)' : ''}:</span>
          <span className="font-semibold tabular-nums">${formatPrice(breakdown?.proratedAmount)}</span>
        </div>

        <div className={`flex justify-between ${mutedText}`}>
          <span>CC Processing Fee (3.99%):</span>
          <span className="tabular-nums">+${formatPrice(breakdown?.membershipCCFee)}</span>
        </div>

        <div className="flex justify-between font-bold pt-2">
          <span>Total Membership Charge:</span>
          <span className="tabular-nums">${formatPrice(breakdown?.totalMembershipCharge)}</span>
        </div>
      </div>
    );
  };

  const renderEnrollmentSection = (tier) => {
    const breakdown = getBreakdown(tier);
    const originalEnrollmentFee = tier.enrollmentFee;

    // Don't show enrollment section if there's no enrollment fee or family mode waives it
    if (!originalEnrollmentFee || isFamilyMode(tier)) return null;

    const flatDiscount = enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount);

    return (
      <div className="pt-4 space-y-1.5">
        <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${mutedText} pb-2`}>Enrollment Fee</div>
        <div className="flex justify-between">
          <span>Original Enrollment Fee:</span>
          <span className="font-semibold tabular-nums">${formatPrice(originalEnrollmentFee)}</span>
        </div>

        {flatDiscount > 0 && (
          <div className="flex justify-between text-gracie-red font-bold">
            <span>Enrollment Fee Discount:</span>
            <span className="tabular-nums">−${formatPrice(flatDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Final Enrollment Fee:</span>
          <span className="font-semibold tabular-nums">${formatPrice(breakdown?.finalEnrollmentFee)}</span>
        </div>

        {tier.hasCCDiscount && (
          <>
            <div className={`flex justify-between ${mutedText}`}>
              <span>CC Processing Fee (3.99%):</span>
              <span className="tabular-nums">+${formatPrice(breakdown?.enrollmentCCFee)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total Enrollment Charge:</span>
              <span className="tabular-nums">${formatPrice(breakdown?.finalEnrollmentFee + breakdown?.enrollmentCCFee)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgColor} py-8 ${textColor} font-sans`}>
      <div className="max-w-2xl mx-auto px-4">
        <div className={`${cardBg} border-2 ${borderColor} p-6 sm:p-8`}>
          <div className="flex flex-col items-center text-center mb-8">
            <img src="/logo.png" alt="Gracie Jiu-Jitsu Bradenton" className="h-14 w-auto mb-3" />
            <div className="w-12 h-1 bg-gracie-red mb-3"></div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Pricing Calculator</h1>
            <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mt-2 ${mutedText}`}>Gracie Jiu-Jitsu Bradenton</p>
          </div>

          <div className="mb-6">
            <label className={labelClass}>Select Plan Tier</label>
            <select
              className={inputClass}
              onChange={(e) => {
                const newTier = e.target.value === "" ? null : TIERS[parseInt(e.target.value)];
                setSelectedTier(newTier);
                if (!newTier || newTier.type === 'prepaid') {
                  setEnrollmentDiscount('');
                }
                if (newTier?.type === 'monthly') {
                  setNumberOfPeople(1);
                }
              }}
              value={selectedTier && TIERS.indexOf(selectedTier) !== -1 ? String(TIERS.indexOf(selectedTier)) : ""}
              style={{WebkitAppearance: 'none'}}
            >
              <option value="">Choose a plan</option>
              <optgroup label="Jiu Jitsu Programs">
                {TIERS
                  .filter(tier => tier.program === 'jiujitsu')
                  .map((tier, index) => (
                    <option key={index} value={TIERS.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Kickboxing Programs">
                {TIERS
                  .filter(tier => tier.program === 'kickboxing')
                  .map((tier, index) => (
                    <option key={index} value={TIERS.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Combined Programs (Jiu Jitsu + Kickboxing)">
                {TIERS
                  .filter(tier => tier.program === 'combined')
                  .map((tier, index) => (
                    <option key={index} value={TIERS.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {selectedTier && (
            <div className={`mb-6 border-l-4 border-gracie-red pl-4 py-1`}>
              <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${mutedText} mb-2`}>Plan Benefits</p>
              <ul className="space-y-1.5 text-sm font-medium">
                <li className="flex items-center"><span className="text-gracie-red font-black mr-2">✓</span>Unlimited Classes</li>
                <li className="flex items-center"><span className="text-gracie-red font-black mr-2">✓</span>Community App Access</li>
                <li className="flex items-center"><span className="text-gracie-red font-black mr-2">✓</span>Easy Cancellation</li>
              </ul>
            </div>
          )}

          {selectedTier && selectedTier.type !== 'family' && renderPeopleInput()}

          {(selectedTier?.type === 'monthly' || selectedTier?.type === 'family') && (
            <>
              {selectedTier?.enrollmentFee > 0 && !isFamilyMode(selectedTier) && renderEnrollmentDiscountCheckbox()}
              {showEnrollmentDiscount && selectedTier?.enrollmentFee > 0 && !isFamilyMode(selectedTier) && (
                <div className="mb-6">
                  <label className={labelClass}>Enrollment Fee Discount ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={selectedTier.enrollmentFee}
                    value={enrollmentDiscount}
                    onChange={handleDiscountChange}
                    className={inputClass}
                    placeholder="Enter discount amount"
                  />
                </div>
              )}
              {renderMilitaryDiscountCheckbox()}
              {showMilitaryDiscount && renderPercentageDiscountInput()}
            </>
          )}

          {selectedTier && (() => {
            const breakdown = getBreakdown(selectedTier);
            const totalToday = selectedTier.type === 'prepaid'
              ? breakdown?.customerPays
              : breakdown?.totalCharge;
            const recurring = selectedTier.type !== 'prepaid' ? breakdown?.adjustedMonthlyPrice : null;
            return (
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-1 bg-gracie-red mr-3"></div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Price Breakdown</h3>
                </div>
                <div className={`border-2 ${borderColor} p-5 text-sm`}>
                  {selectedTier.type === 'prepaid' ? (
                    <div className="space-y-1.5">
                      <div className={`text-[11px] font-bold uppercase tracking-[0.15em] ${mutedText} pb-2`}>{selectedTier.months}-Month Prepaid Plan</div>
                      <div className="flex justify-between">
                        <span>Program Price{numberOfPeople > 1 ? ' (1st Person)' : ''}:</span>
                        <span className="font-semibold tabular-nums">${formatPrice(selectedTier.totalPrice)}</span>
                      </div>
                      {numberOfPeople > 1 && (
                        <div className="flex justify-between">
                          <span>Additional Members (×{breakdown?.additionalPeople} @ 20% off):</span>
                          <span className="font-semibold tabular-nums">+${formatPrice(breakdown?.additionalTotal)}</span>
                        </div>
                      )}
                      <p className={`text-[11px] uppercase tracking-widest pt-2 ${mutedText}`}>We cover ${formatPrice(breakdown?.ccFee)} in CC processing fees.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`border-b-2 ${subtleBorder}`}>
                        {renderMonthlyBreakdown()}
                      </div>
                      {renderEnrollmentSection(selectedTier)}
                    </>
                  )}
                </div>

                <div className="bg-black text-white p-5 mt-4 border-t-4 border-gracie-red">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Total Today</span>
                    <span className="text-3xl font-black tabular-nums">${formatPrice(totalToday)}</span>
                  </div>
                  {recurring != null && (
                    <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-neutral-700">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Then Monthly</span>
                      <span className="text-base font-bold tabular-nums text-neutral-200">${formatPrice(recurring)}/mo</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default App;