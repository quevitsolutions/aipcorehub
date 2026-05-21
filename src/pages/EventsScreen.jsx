/**
 * EventsScreen — MetaVerse Hub Router
 * 
 * This is the top-level metaverse entry point. It renders:
 *  - MetaverseScreen (main portal)
 *  - AIPLiveScreen (webinars)
 *  - AIPAcademyScreen (courses)
 *  - AIPDAOScreen (governance)
 *  - AIPRewardsScreen (NFT/BNB rewards)
 *  - AIPCommunityScreen (virtual rooms)
 *  - AIPAIHostScreen (AI agents)
 * 
 * Navigation is controlled via the `subView` state so there's
 * no need for a new router — it mounts inside the existing
 * AnimatePresence controlled main content area.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MetaverseScreen from './MetaverseScreen.jsx';
import AIPLiveScreen from './AIPLiveScreen.jsx';
import AIPAcademyScreen from './AIPAcademyScreen.jsx';
import AIPDAOScreen from './AIPDAOScreen.jsx';
import AIPRewardsScreen from './AIPRewardsScreen.jsx';
import AIPCommunityScreen from './AIPCommunityScreen.jsx';
import AIPAIHostScreen from './AIPAIHostScreen.jsx';

const MODULE_COMPONENTS = {
  live: AIPLiveScreen,
  academy: AIPAcademyScreen,
  dao: AIPDAOScreen,
  rewards: AIPRewardsScreen,
  community: AIPCommunityScreen,
  'ai-host': AIPAIHostScreen,
};

export default function EventsScreen() {
  const [subView, setSubView] = useState(null);

  const navigateTo = (moduleId) => setSubView(moduleId);
  const goBack = () => setSubView(null);

  const ActiveComponent = subView ? MODULE_COMPONENTS[subView] : null;

  return (
    <AnimatePresence mode="wait">
      {ActiveComponent ? (
        <motion.div
          key={subView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ActiveComponent onBack={goBack} />
        </motion.div>
      ) : (
        <motion.div
          key="metaverse-hub"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <MetaverseScreen onNavigate={navigateTo} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
