import React from 'react';

function App() {
  const [selectedTier, setSelectedTier] = React.useState(null);
  const [enrollmentDiscount, setEnrollmentDiscount] = React.useState('');
  const [daysLeft, setDaysLeft] = React.useState(0);
  const [totalDaysInMonth, setTotalDaysInMonth] = React.useState(0);
  const [numberOfPeople, setNumberOfPeople] = React.useState(1);
  const [darkMode, setDarkMode] = React.useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const CC_PERCENTAGE = 0.0399;

  const tiers = [
    // Jiu Jitsu Tiers
    { name: 'Jiu Jitsu Basic', monthlyPrice: 155, enrollmentFee: 399, hasCCDiscount: true, program: 'jiujitsu', type: 'monthly' },
    { name: 'Jiu Jitsu Standard', monthlyPrice: 185, enrollmentFee: 299, hasCCDiscount: true, program: 'jiujitsu', type: 'monthly' },
    { name: 'Jiu Jitsu Premium', monthlyPrice: 220, enrollmentFee: 0, hasCCDiscount: false, program: 'jiujitsu', type: 'monthly' },
    { name: 'Jiu Jitsu 6-Month Plan', totalPrice: 997, program: 'jiujitsu', type: 'prepaid', months: 6 },
    { name: 'Jiu Jitsu 12-Month Plan', totalPrice: 1797, program: 'jiujitsu', type: 'prepaid', months: 12 },
    // Kickboxing Tiers
    { name: 'Kickboxing Basic', monthlyPrice: 130, enrollmentFee: 399, hasCCDiscount: true, program: 'kickboxing', type: 'monthly' },
    { name: 'Kickboxing Standard', monthlyPrice: 165, enrollmentFee: 299, hasCCDiscount: true, program: 'kickboxing', type: 'monthly' },
    { name: 'Kickboxing Premium', monthlyPrice: 200, enrollmentFee: 0, hasCCDiscount: false, program: 'kickboxing', type: 'monthly' },
    { name: 'Kickboxing 6-Month Plan', totalPrice: 900, program: 'kickboxing', type: 'prepaid', months: 6 },
    { name: 'Kickboxing 12-Month Plan', totalPrice: 1500, program: 'kickboxing', type: 'prepaid', months: 12 },
    // Combined Program Tiers
    { name: 'Combined Basic', monthlyPrice: 200, enrollmentFee: 399, hasCCDiscount: true, program: 'combined', type: 'monthly' },
    { name: 'Combined Standard', monthlyPrice: 220, enrollmentFee: 299, hasCCDiscount: true, program: 'combined', type: 'monthly' },
    { name: 'Combined Premium', monthlyPrice: 245, enrollmentFee: 0, hasCCDiscount: false, program: 'combined', type: 'monthly' },
    { name: 'Combined 6-Month Plan', totalPrice: 1399, program: 'combined', type: 'prepaid', months: 6 },
    { name: 'Combined 12-Month Plan', totalPrice: 2299, program: 'combined', type: 'prepaid', months: 12 },
  ];

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

  const getDiscountedEnrollmentFee = (tier) => {
    if (!tier) return 0;
    
    // Check if it's a family plan (3 or more people)
    if (numberOfPeople >= 3) {
      const familyEnrollmentFee = 99;
      const discountAmount = enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount);
      return Math.max(0, familyEnrollmentFee - discountAmount);
    }

    // Regular enrollment fee logic
    const discountAmount = enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount);
    return Math.max(0, tier.enrollmentFee - discountAmount);
  };

  const calculateEnrollmentChargeAmount = (enrollmentAmount, hasCCDiscount) => {
    if (!hasCCDiscount) return enrollmentAmount;
    return enrollmentAmount / (1 - CC_PERCENTAGE);
  };

  const calculateMembershipCCFee = (amount) => {
    return amount * CC_PERCENTAGE;
  };

  const getAdjustedMonthlyPrice = (tier) => {
    if (!tier || tier.type === 'prepaid') return tier?.monthlyPrice || 0;
    
    // For 3 or more people (Family Plan)
    if (numberOfPeople >= 3) {
      if (tier.program === 'jiujitsu') {
        return 400;  // Jiu Jitsu Family Plan
      } else if (tier.program === 'combined') {
        return 470;  // Combined Family Plan
      } else if (tier.program === 'kickboxing') {
        return tier.monthlyPrice;  // Regular price for kickboxing
      }
    }
    
    return tier.monthlyPrice;
  };

  const formatOptionLabel = (tier) => {
    if (tier.type === 'monthly') {
      const price = numberOfPeople >= 3 ? getAdjustedMonthlyPrice(tier) : tier.monthlyPrice;
      const label = numberOfPeople >= 3 && (tier.program === 'jiujitsu' || tier.program === 'combined') 
        ? `${tier.name} (Family Plan)` 
        : tier.name;
      return `${label} - $${price}/month`;
    } else {
      const actualCharge = tier.totalPrice / (1 - CC_PERCENTAGE);
      const ccFee = actualCharge - tier.totalPrice;
      return `${tier.name} - $${tier.totalPrice} (We cover $${formatPrice(ccFee)} in fees)`;
    }
  };

  const getBreakdown = (tier) => {
    if (!tier) return null;

    if (tier.type === 'prepaid') {
      const actualCharge = tier.totalPrice / (1 - CC_PERCENTAGE);
      const ccFee = actualCharge - tier.totalPrice;
      return {
        isPrepaid: true,
        months: tier.months,
        customerPays: tier.totalPrice,
        actualCharge: actualCharge,
        ccFee: ccFee,
        effectiveMonthly: tier.totalPrice / tier.months,
        totalCharge: tier.totalPrice
      };
    }

    const adjustedMonthlyPrice = getAdjustedMonthlyPrice(tier);
    const isFamilyPlan = numberOfPeople >= 3 && (tier.program === 'jiujitsu' || tier.program === 'combined');
    const proratedAmount = calculateProratedAmount(adjustedMonthlyPrice) * (isFamilyPlan ? 1 : numberOfPeople);
    const finalEnrollmentFee = getDiscountedEnrollmentFee(tier);
    
    const membershipCCFee = calculateMembershipCCFee(proratedAmount);
    const totalMembershipCharge = proratedAmount + membershipCCFee;

    // Calculate the enrollment charge amount as original fee minus CC fee
    const enrollmentChargeAmount = finalEnrollmentFee - (finalEnrollmentFee * CC_PERCENTAGE);
    const enrollmentCCFee = finalEnrollmentFee * CC_PERCENTAGE;

    return {
      isPrepaid: false,
      proratedAmount,
      membershipCCFee,
      totalMembershipCharge,
      finalEnrollmentFee,
      enrollmentChargeAmount,
      enrollmentCCFee,
      totalCharge: totalMembershipCharge + enrollmentChargeAmount,
      adjustedMonthlyPrice,
      numberOfPeople,
      isFamilyPlan
    };
  };

  const formatPrice = (amount) => {
    return Number(amount).toFixed(2);
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  const renderPeopleInput = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Number of People</label>
      <div className="flex items-center">
        <button
          onClick={() => setNumberOfPeople(prev => Math.max(1, prev - 1))}
          className={`px-4 py-3 border rounded-l-lg ${borderColor} ${cardBg} hover:bg-gray-100 dark:hover:bg-gray-700`}
          type="button"
        >
          -
        </button>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="1"
          value={numberOfPeople}
          onChange={(e) => setNumberOfPeople(Math.max(1, parseInt(e.target.value) || 1))}
          className={`w-20 p-3 border-y text-center ${borderColor} ${cardBg} ${textColor}`}
          style={{ appearance: 'textfield' }}
        />
        <button
          onClick={() => setNumberOfPeople(prev => prev + 1)}
          className={`px-4 py-3 border rounded-r-lg ${borderColor} ${cardBg} hover:bg-gray-100 dark:hover:bg-gray-700`}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );

  const renderMonthlyBreakdown = () => {
    const breakdown = getBreakdown(selectedTier);
    const isFamilyPlan = numberOfPeople >= 3 && (selectedTier.program === 'jiujitsu' || selectedTier.program === 'combined');
    
    return (
      <div className={`pb-4 ${selectedTier.type === 'monthly' ? `border-b ${borderColor}` : ''}`}>
        <div className="font-medium pb-2">Membership Charges:</div>
        <div className="flex justify-between">
          <span>Monthly Price {isFamilyPlan ? '(Family Plan Total)' : 'per Person'}:</span>
          <span>${formatPrice(breakdown?.adjustedMonthlyPrice)}</span>
        </div>
        
        {!isFamilyPlan && (
          <div className="flex justify-between">
            <span>Number of People:</span>
            <span>x{numberOfPeople}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Daily Rate (based on {totalDaysInMonth}-day month):</span>
          <span>${formatPrice(breakdown?.adjustedMonthlyPrice / totalDaysInMonth)}/day</span>
        </div>
        
        <div className="flex justify-between">
          <span>Days Left in Month:</span>
          <span>{daysLeft} days</span>
        </div>
        
        <div className="flex justify-between">
          <span>Prorated Amount {isFamilyPlan ? '(Family Total)' : '(Total for All People)'}:</span>
          <span>${formatPrice(breakdown?.proratedAmount)}</span>
        </div>

        <div className={`flex justify-between ${mutedText}`}>
          <span>CC Processing Fee (3.99%):</span>
          <span>+${formatPrice(breakdown?.membershipCCFee)}</span>
        </div>

        <div className="flex justify-between font-medium pt-2">
          <span>Total Membership Charge:</span>
          <span>${formatPrice(breakdown?.totalMembershipCharge)}</span>
        </div>
      </div>
    );
  };

  const renderEnrollmentSection = (tier) => {
    const breakdown = getBreakdown(tier);
    const originalEnrollmentFee = numberOfPeople >= 3 ? 99 : tier.enrollmentFee;

    return (
      <div className="pt-4">
        <div className="font-medium pb-2">Enrollment Fee:</div>
        <div className="flex justify-between">
          <span>Original Enrollment Fee {numberOfPeople >= 3 ? '(Family Plan)' : ''}:</span>
          <span>${formatPrice(originalEnrollmentFee)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Enrollment Fee Discount:</span>
          <span>-${formatPrice(enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount))}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Final Enrollment Fee:</span>
          <span>${formatPrice(breakdown?.finalEnrollmentFee)}</span>
        </div>

        {tier.hasCCDiscount && (
          <>
            <div className={`flex justify-between ${mutedText}`}>
              <span>CC Processing Fee (3.99%):</span>
              <span>-${formatPrice(breakdown?.enrollmentCCFee)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-emerald-500 font-medium">Amount We Charge (to cover cc fee):</span>
              <span className="text-emerald-500 font-medium">${formatPrice(breakdown?.enrollmentChargeAmount)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgColor} py-8 ${textColor}`}>
      <div className="max-w-2xl mx-auto px-4">
        <div className={`${cardBg} rounded-lg shadow-lg p-6`}>
          <h1 className="text-2xl font-bold text-center mb-6">Pricing Calculator</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Plan Tier</label>
            <select 
              className={`w-full p-3 border rounded-lg ${borderColor} ${cardBg} ${textColor}`}
              onChange={(e) => {
                const newTier = e.target.value === "" ? null : tiers[parseInt(e.target.value)];
                setSelectedTier(newTier);
                if (!newTier || newTier.type === 'prepaid') {
                  setEnrollmentDiscount('');
                }
              }}
              value={selectedTier && tiers.indexOf(selectedTier) !== -1 ? tiers.indexOf(selectedTier) : ""}
              style={{WebkitAppearance: 'none'}}
            >
              <option value="">Choose a plan</option>
              <optgroup label="Jiu Jitsu Programs">
                {tiers
                  .filter(tier => tier.program === 'jiujitsu')
                  .map((tier, index) => (
                    <option key={index} value={tiers.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Kickboxing Programs">
                {tiers
                  .filter(tier => tier.program === 'kickboxing')
                  .map((tier, index) => (
                    <option key={index} value={tiers.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Combined Programs (Jiu Jitsu + Kickboxing)">
                {tiers
                  .filter(tier => tier.program === 'combined')
                  .map((tier, index) => (
                    <option key={index} value={tiers.indexOf(tier)}>
                      {formatOptionLabel(tier)}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {selectedTier && renderPeopleInput()}

          {/* Only show enrollment discount input for monthly plans with enrollment fee */}
          {selectedTier?.type === 'monthly' && selectedTier?.enrollmentFee > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Enrollment Fee Discount ($)</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max={selectedTier.enrollmentFee}
                value={enrollmentDiscount}
                onChange={handleDiscountChange}
                className={`w-full p-3 border rounded-lg ${borderColor} ${cardBg} ${textColor}`}
                placeholder="Enter discount amount"
              />
            </div>
          )}

          {selectedTier && (
            <div className={`mt-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <h3 className="font-semibold text-lg mb-4">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                {selectedTier.type === 'prepaid' ? (
                  // Prepaid plan breakdown
                  <div className="pb-4">
                    <div className="font-medium pb-2">{selectedTier.months}-Month Prepaid Plan:</div>
                    <div className="flex justify-between">
                      <span>Total Price:</span>
                      <span>${formatPrice(selectedTier.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Monthly Rate:</span>
                      <span>${formatPrice(getBreakdown(selectedTier)?.effectiveMonthly)}/month</span>
                    </div>
                    <div className={`flex justify-between ${mutedText}`}>
                      <span>CC Processing Fee (We Cover):</span>
                      <span>-${formatPrice(getBreakdown(selectedTier)?.ccFee)}</span>
                    </div>
                    <div className={`flex justify-between font-semibold text-lg pt-4`}>
                      <span>Total Amount Customer Pays:</span>
                      <span>${formatPrice(selectedTier.totalPrice)}</span>
                    </div>
                  </div>
                ) : (
                  // Monthly plan breakdown
                  <>
                    {renderMonthlyBreakdown()}
                    
                    {/* Enrollment Section - Only show for monthly plans */}
                    {selectedTier.type === 'monthly' && renderEnrollmentSection(selectedTier)}
                    
                    <div className={`flex justify-between font-semibold text-lg pt-4 border-t ${borderColor} mt-4`}>
                      <span>Total Amount Customer Pays:</span>
                      <span>${formatPrice(getBreakdown(selectedTier)?.totalCharge)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;