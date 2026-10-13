import { validLanguage,languageCodes,type InterfaceLanguage } from './languages';

export const originalDescriptions = {
  'voice-midi':['Geuza sauti, humming na melody kuwa MIDI inayoweza kuhaririwa ndani ya DAW yako.'],
  'bushman-bass':['Bass instrument yenye presets za electric, slap, fretless na deep sub kwa production ya kisasa.','Expressive bass instrument yenye presets za electric, slap, fretless na deep sub.'],
  'mlam-piano':['The piano instrument from MLAM Studio Pro. Standalone release coming soon.'],
  'pro-eq':['Parametric EQ safi yenye spectrum ya realtime na workflow ya haraka kwa mixing.'],
  'stereo-imager':['The Stereo Forge Imager from MLAM Studio Pro. Shape stereo width with mid/side processing, input gain and output gain. Standalone release coming soon.'],
  'mlam-daw':['Our complete workspace for recording, arranging and mixing music. Coming soon.'],
};
export type CatalogId=keyof typeof originalDescriptions;
export type DescriptionTranslations=Partial<Record<InterfaceLanguage,string>>;
export const catalogDescriptions:Record<InterfaceLanguage,Record<CatalogId,string>>={
  en:{
    'voice-midi':'Turn your voice, humming and melodies into editable MIDI inside your DAW.',
    'bushman-bass':'An expressive bass instrument with electric, slap, fretless and deep-sub presets for modern music production.',
    'mlam-piano':'The piano instrument from MLAM Studio Pro. A standalone release is coming soon.',
    'pro-eq':'A clean parametric EQ with a real-time spectrum and a fast mixing workflow.',
    'stereo-imager':'The Stereo Forge Imager from MLAM Studio Pro. Shape stereo width with mid/side processing, input gain and output gain. A standalone release is coming soon.',
    'mlam-daw':'Our complete workspace for recording, arranging and mixing music. Coming soon.',
  },
  sw:{
    'voice-midi':'Geuza sauti yako, humming na melodi kuwa MIDI inayoweza kuhaririwa ndani ya DAW yako.',
    'bushman-bass':'Ala ya besi yenye uchezaji wa hisia na presets za electric, slap, fretless na deep sub kwa utengenezaji wa muziki wa kisasa.',
    'mlam-piano':'Ala ya piano kutoka MLAM Studio Pro. Toleo linalojitegemea linakuja hivi karibuni.',
    'pro-eq':'EQ ya parametric yenye sauti safi, spectrum ya wakati halisi na mtiririko wa haraka wa kuchanganya sauti.',
    'stereo-imager':'Stereo Forge Imager kutoka MLAM Studio Pro. Rekebisha upana wa stereo kwa uchakataji wa mid/side, kiwango cha sauti kinachoingia na kinachotoka. Toleo linalojitegemea linakuja hivi karibuni.',
    'mlam-daw':'Sehemu yetu kamili ya kurekodi, kupanga na kuchanganya muziki. Inakuja hivi karibuni.',
  },
  fr:{
    'voice-midi':'Transformez votre voix, vos fredonnements et vos mélodies en MIDI modifiable dans votre DAW.',
    'bushman-bass':'Un instrument de basse expressif avec des presets électriques, slap, fretless et sub profond pour la production musicale moderne.',
    'mlam-piano':'L’instrument de piano de MLAM Studio Pro. Une version autonome sera bientôt disponible.',
    'pro-eq':'Un égaliseur paramétrique transparent avec un spectre en temps réel et un workflow de mixage rapide.',
    'stereo-imager':'Le Stereo Forge Imager de MLAM Studio Pro. Ajustez la largeur stéréo avec le traitement mid/side et les gains d’entrée et de sortie. Une version autonome sera bientôt disponible.',
    'mlam-daw':'Notre espace complet pour enregistrer, arranger et mixer de la musique. Bientôt disponible.',
  },
  es:{
    'voice-midi':'Convierte tu voz, tarareos y melodías en MIDI editable dentro de tu DAW.',
    'bushman-bass':'Un instrumento de bajo expresivo con presets eléctricos, slap, fretless y subgrave profundo para la producción musical moderna.',
    'mlam-piano':'El instrumento de piano de MLAM Studio Pro. La versión independiente estará disponible próximamente.',
    'pro-eq':'Un ecualizador paramétrico transparente con espectro en tiempo real y un flujo de mezcla rápido.',
    'stereo-imager':'El Stereo Forge Imager de MLAM Studio Pro. Ajusta la amplitud estéreo con procesamiento mid/side y ganancias de entrada y salida. La versión independiente llegará próximamente.',
    'mlam-daw':'Nuestro espacio completo para grabar, arreglar y mezclar música. Próximamente.',
  },
  de:{
    'voice-midi':'Verwandle deine Stimme, dein Summen und deine Melodien in bearbeitbares MIDI direkt in deiner DAW.',
    'bushman-bass':'Ein ausdrucksstarkes Bassinstrument mit Presets für Electric, Slap, Fretless und tiefen Subbass für moderne Musikproduktion.',
    'mlam-piano':'Das Pianoinstrument aus MLAM Studio Pro. Eine eigenständige Version erscheint demnächst.',
    'pro-eq':'Ein transparenter parametrischer EQ mit Echtzeitspektrum und schnellem Mixing-Workflow.',
    'stereo-imager':'Der Stereo Forge Imager aus MLAM Studio Pro. Gestalte die Stereobreite mit Mid/Side-Bearbeitung sowie Eingangs- und Ausgangsverstärkung. Eine eigenständige Version erscheint demnächst.',
    'mlam-daw':'Unser kompletter Arbeitsbereich zum Aufnehmen, Arrangieren und Mischen von Musik. Demnächst verfügbar.',
  },
  pt:{
    'voice-midi':'Transforme sua voz, melodias e sons cantarolados em MIDI editável dentro da sua DAW.',
    'bushman-bass':'Um instrumento de baixo expressivo com presets elétricos, slap, fretless e subgrave profundo para a produção musical moderna.',
    'mlam-piano':'O instrumento de piano do MLAM Studio Pro. Uma versão independente estará disponível em breve.',
    'pro-eq':'Um equalizador paramétrico transparente com espectro em tempo real e um fluxo de mixagem rápido.',
    'stereo-imager':'O Stereo Forge Imager do MLAM Studio Pro. Ajuste a largura estéreo com processamento mid/side e ganhos de entrada e saída. Uma versão independente estará disponível em breve.',
    'mlam-daw':'Nosso espaço completo para gravar, organizar e mixar música. Em breve.',
  },
  it:{
    'voice-midi':'Trasforma la tua voce, i motivi canticchiati e le melodie in MIDI modificabile all’interno della tua DAW.',
    'bushman-bass':'Uno strumento di basso espressivo con preset elettrici, slap, fretless e sub profondi per la produzione musicale moderna.',
    'mlam-piano':'Lo strumento di pianoforte di MLAM Studio Pro. Una versione autonoma sarà disponibile a breve.',
    'pro-eq':'Un equalizzatore parametrico trasparente con spettro in tempo reale e un flusso di mixaggio rapido.',
    'stereo-imager':'Lo Stereo Forge Imager di MLAM Studio Pro. Regola l’ampiezza stereo con elaborazione mid/side e guadagni di ingresso e uscita. Una versione autonoma sarà disponibile a breve.',
    'mlam-daw':'Il nostro ambiente completo per registrare, arrangiare e mixare musica. In arrivo.',
  },
  ar:{
    'voice-midi':'حوّل صوتك وهمهماتك وألحانك إلى MIDI قابل للتحرير داخل محطة العمل الصوتية الخاصة بك.',
    'bushman-bass':'آلة باس تعبيرية مع إعدادات مسبقة للباس الكهربائي والسلاب والباس دون فريت والباس العميق لإنتاج الموسيقى الحديثة.',
    'mlam-piano':'آلة البيانو من MLAM Studio Pro. ستتوفر نسخة مستقلة قريباً.',
    'pro-eq':'معادل صوت بارامتري شفاف مع عرض الطيف في الوقت الفعلي وسير عمل سريع للمزج.',
    'stereo-imager':'أداة Stereo Forge Imager من MLAM Studio Pro. اضبط عرض الستيريو باستخدام معالجة mid/side وكسب الإدخال والإخراج. ستتوفر نسخة مستقلة قريباً.',
    'mlam-daw':'مساحة عملنا المتكاملة لتسجيل الموسيقى وترتيبها ومزجها. قريباً.',
  },
  zh:{
    'voice-midi':'将您的声音、哼唱和旋律转换为可在 DAW 内编辑的 MIDI。',
    'bushman-bass':'富有表现力的贝斯乐器，提供电贝斯、拍击、无品和深沉超低音预设，适合现代音乐制作。',
    'mlam-piano':'来自 MLAM Studio Pro 的钢琴乐器。独立版本即将推出。',
    'pro-eq':'声音透明的参数均衡器，配备实时频谱和高效混音工作流程。',
    'stereo-imager':'来自 MLAM Studio Pro 的 Stereo Forge Imager。通过中侧处理以及输入和输出增益调整立体声宽度。独立版本即将推出。',
    'mlam-daw':'用于录音、编曲和混音的完整音乐工作空间。即将推出。',
  },
  ja:{
    'voice-midi':'声、ハミング、メロディーを DAW 内で編集可能な MIDI に変換します。',
    'bushman-bass':'エレクトリック、スラップ、フレットレス、ディープサブのプリセットを備えた、現代の音楽制作向けの表現豊かなベース音源。',
    'mlam-piano':'MLAM Studio Pro のピアノ音源。独立した製品版は近日公開予定です。',
    'pro-eq':'リアルタイムのスペクトラム表示と素早いミキシング作業に対応する、透明感のあるパラメトリック EQ。',
    'stereo-imager':'MLAM Studio Pro の Stereo Forge Imager。ミッド／サイド処理と入出力ゲインでステレオ幅を調整します。独立した製品版は近日公開予定です。',
    'mlam-daw':'録音、編曲、ミキシングを行うための総合音楽制作環境。近日公開予定です。',
  },
  hi:{
    'voice-midi':'अपनी आवाज़, गुनगुनाहट और धुनों को DAW के भीतर संपादन योग्य MIDI में बदलें।',
    'bushman-bass':'आधुनिक संगीत निर्माण के लिए इलेक्ट्रिक, स्लैप, फ्रेटलेस और डीप-सब प्रीसेट वाला अभिव्यक्तिपूर्ण बेस वाद्ययंत्र।',
    'mlam-piano':'MLAM Studio Pro का पियानो वाद्ययंत्र। इसका स्वतंत्र संस्करण जल्द आएगा।',
    'pro-eq':'रीयल-टाइम स्पेक्ट्रम और तेज़ मिक्सिंग वर्कफ़्लो वाला साफ़-साउंडिंग पैरामेट्रिक EQ।',
    'stereo-imager':'MLAM Studio Pro का Stereo Forge Imager। मिड/साइड प्रोसेसिंग तथा इनपुट और आउटपुट गेन से स्टीरियो चौड़ाई बदलें। स्वतंत्र संस्करण जल्द आएगा।',
    'mlam-daw':'संगीत की रिकॉर्डिंग, अरेंजमेंट और मिक्सिंग के लिए हमारा संपूर्ण कार्यक्षेत्र। जल्द आ रहा है।',
  },
  ru:{
    'voice-midi':'Превратите голос, напевы и мелодии в редактируемое MIDI прямо внутри вашей DAW.',
    'bushman-bass':'Выразительный басовый инструмент с пресетами электрического баса, слэпа, безладового баса и глубокого саб-баса для современной музыкальной продукции.',
    'mlam-piano':'Фортепианный инструмент из MLAM Studio Pro. Отдельная версия появится скоро.',
    'pro-eq':'Прозрачный параметрический эквалайзер со спектром в реальном времени и быстрым рабочим процессом сведения.',
    'stereo-imager':'Stereo Forge Imager из MLAM Studio Pro. Настраивайте ширину стерео с обработкой mid/side и регулировкой входного и выходного усиления. Отдельная версия появится скоро.',
    'mlam-daw':'Наше полноценное рабочее пространство для записи, аранжировки и сведения музыки. Скоро.',
  },
};

export function validateDescriptionTranslations(input:unknown):DescriptionTranslations {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Description translations must be a language-to-text object');
  const entries=Object.entries(input);
  if(entries.length>languageCodes.length)throw new Error('Too many description languages');
  const result:DescriptionTranslations={};
  for(const [code,text] of entries){
    if(!languageCodes.some(language=>language===code)||typeof text!=='string'||text.length>4000)throw new Error('Use supported language codes and descriptions of at most 4000 characters');
    if(text.trim())result[code as InterfaceLanguage]=text.trim();
  }
  return result;
}
export function readDescriptionTranslations(input:unknown):DescriptionTranslations {
  try{return validateDescriptionTranslations(typeof input==='string'?JSON.parse(input):input);}catch{return {};}
}
export function builtInTranslations(product:{id:string;description:string}):DescriptionTranslations {
  const id=product.id as CatalogId;
  // Never silently replace new owner copy with stale translations for the original catalog.
  if(!Object.hasOwn(originalDescriptions,id)||!originalDescriptions[id].includes(product.description))return {};
  return Object.fromEntries(languageCodes.map(code=>[code,catalogDescriptions[code][id]]));
}
export function productDescription(product:{id:string;description:string;description_translations?:unknown},value:unknown){
  const language=validLanguage(value);
  const translations={...builtInTranslations(product),...readDescriptionTranslations(product.description_translations)};
  if(translations[language])return {text:translations[language]!,language,isFallback:false};
  return {text:translations.en||product.description,language:'en' as const,isFallback:language!=='en'};
}
export const descriptionFallbackNotice:Record<InterfaceLanguage,string>={
  en:'This description is available in English only.',sw:'Tafsiri ya maelezo haya bado haijawekwa. English inaonyeshwa.',
  fr:'Cette description n’a pas encore été traduite. L’anglais est affiché.',es:'Esta descripción aún no está traducida. Se muestra en inglés.',
  de:'Diese Beschreibung ist noch nicht übersetzt. Englisch wird angezeigt.',pt:'Esta descrição ainda não foi traduzida. O texto em inglês é exibido.',
  it:'Questa descrizione non è ancora tradotta. Viene mostrata in inglese.',ar:'لم تتم ترجمة هذا الوصف بعد. يُعرض باللغة الإنجليزية.',
  zh:'此描述尚未翻译，显示英语版本。',ja:'この説明はまだ翻訳されていません。英語で表示しています。',
  hi:'इस विवरण का अनुवाद अभी नहीं है। अंग्रेज़ी में दिखाया जा रहा है।',ru:'Это описание ещё не переведено. Показана английская версия.',
};
