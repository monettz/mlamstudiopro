// Mechanical substitutions for existing UI controls; product data is untouched.
import { readFileSync,writeFileSync } from 'node:fs';
const path='app/storefront.tsx';let source=readFileSync(path,'utf8');
const replacements=[
 ['"Buy full version"',"t('buy')"],['"Notify me"',"t('notify')"],
 ['"AVAILABLE"',"t('available')"],['"COMING SOON"',"t('comingSoon')"],
 ['>View details →</button>',">{t('details')} →</button>"],
 ['>Download with license ↓</a>',">{t('licensedDownload')} ↓</a>"],
 ['>Try ↓</a>',">{t('tryDemo')} ↓</a>"],['>Try</button>',">{t('tryDemo')}</button>"],
 ['>Demo coming soon</button>',">{t('demoSoon')}</button>"]
];
for(const [from,to] of replacements)source=source.split(from).join(to);
writeFileSync(path,source);
