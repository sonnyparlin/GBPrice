import React from 'react';

function App() {
  const [selectedTier, setSelectedTier] = React.useState(null);
  const [enrollmentDiscount, setEnrollmentDiscount] = React.useState('');
  const [daysLeft, setDaysLeft] = React.useState(0);
  const [darkMode, setDarkMode] = React.useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const CC_PERCENTAGE = 0.0399;
  const STANDARD_MONTH_DAYS = 30;

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
  }, []);

  const calculateProratedAmount = (monthlyPrice) => {
    if (!monthlyPrice) return 0;
    const dailyRate = Number((monthlyPrice / STANDARD_MONTH_DAYS).toFixed(10));
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

  const formatOptionLabel = (tier) => {
    if (tier.type === 'monthly') {
      return `${tier.name} - $${tier.monthlyPrice}/month`;
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

    // Original monthly calculation logic
    const proratedAmount = calculateProratedAmount(tier.monthlyPrice);
    const finalEnrollmentFee = getDiscountedEnrollmentFee(tier);
    
    const membershipCCFee = calculateMembershipCCFee(proratedAmount);
    const totalMembershipCharge = proratedAmount + membershipCCFee;

    const enrollmentChargeAmount = calculateEnrollmentChargeAmount(finalEnrollmentFee, tier.hasCCDiscount);
    const enrollmentCCFee = enrollmentChargeAmount * CC_PERCENTAGE;

    return {
      isPrepaid: false,
      proratedAmount,
      membershipCCFee,
      totalMembershipCharge,
      finalEnrollmentFee,
      enrollmentChargeAmount: tier.hasCCDiscount ? enrollmentChargeAmount : finalEnrollmentFee,
      enrollmentCCFee,
      totalCharge: totalMembershipCharge + (tier.hasCCDiscount ? finalEnrollmentFee : enrollmentChargeAmount)
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
                    {/* Membership Section */}
                    <div className={`pb-4 ${selectedTier.type === 'monthly' ? `border-b ${borderColor}` : ''}`}>
                      <div className="font-medium pb-2">Membership Charges:</div>
                      <div className="flex justify-between">
                        <span>Monthly Price:</span>
                        <span>${formatPrice(selectedTier.monthlyPrice)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Daily Rate (based on 30-day month):</span>
                        <span>${formatPrice(selectedTier.monthlyPrice / STANDARD_MONTH_DAYS)}/day</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Days Left in Month:</span>
                        <span>{daysLeft} days</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Prorated Amount:</span>
                        <span>${formatPrice(getBreakdown(selectedTier)?.proratedAmount)}</span>
                      </div>

                      <div className={`flex justify-between ${mutedText}`}>
                        <span>CC Processing Fee (3.99%):</span>
                        <span>+${formatPrice(getBreakdown(selectedTier)?.membershipCCFee)}</span>
                      </div>

                      <div className="flex justify-between font-medium pt-2">
                        <span>Total Membership Charge:</span>
                        <span>${formatPrice(getBreakdown(selectedTier)?.totalMembershipCharge)}</span>
                      </div>
                    </div>

                    {/* Enrollment Section - Only show for monthly plans */}
                    {selectedTier.type === 'monthly' && (
                      <div className="pt-4">
                        <div className="font-medium pb-2">Enrollment Fee:</div>
                        <div className="flex justify-between">
                          <span>Original Enrollment Fee:</span>
                          <span>${formatPrice(selectedTier.enrollmentFee)}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Enrollment Fee Discount:</span>
                          <span>-${formatPrice(enrollmentDiscount === '' ? 0 : Number(enrollmentDiscount))}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Final Enrollment Fee:</span>
                          <span>${formatPrice(getBreakdown(selectedTier)?.finalEnrollmentFee)}</span>
                        </div>

                        {selectedTier.hasCCDiscount && (
                          <>
                            <div className={`flex justify-between ${mutedText}`}>
                              <span>Amount to be Charged:</span>
                              <span>${formatPrice(getBreakdown(selectedTier)?.enrollmentChargeAmount)}</span>
                            </div>
                            
                            <div className={`flex justify-between ${mutedText}`}>
                              <span>CC Processing Fee (3.99%):</span>
                              <span>-${formatPrice(getBreakdown(selectedTier)?.enrollmentCCFee)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
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