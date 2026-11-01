import { useRef, useState } from 'react';
import { Dialog } from '../../shared/ui/Dialog';
const groups = [
  {
    title: 'Vocales',
    sounds: [
      ['ə', 'about'],
      ['æ', 'cat'],
      ['ʊ', 'put'],
      ['ɒ', 'got (UK)'],
      ['ɪ', 'sit'],
      ['i', 'happy'],
      ['e', 'bed'],
      ['ʌ', 'cup'],
      ['ɜː', 'heard (UK)'],
      ['ɑː', 'car'],
      ['uː', 'too'],
      ['ɔː', 'saw'],
      ['iː', 'see'],
    ],
  },
  {
    title: 'Diptongos',
    sounds: [
      ['eə', 'where (UK)'],
      ['ɪə', 'near (UK)'],
      ['ʊə', 'tour (UK)'],
      ['ɔɪ', 'boy'],
      ['aɪ', 'buy'],
      ['eɪ', 'say'],
      ['əʊ', 'go (UK)'],
      ['oʊ', 'go (US)'],
      ['aʊ', 'now'],
    ],
  },
  {
    title: 'Consonantes',
    sounds: [
      ['p', 'put'],
      ['b', 'buy'],
      ['f', 'feel'],
      ['v', 'give'],
      ['t', 'take'],
      ['d', 'do'],
      ['k', 'keep'],
      ['ɡ', 'get'],
      ['θ', 'think'],
      ['ð', 'this'],
      ['tʃ', 'catch'],
      ['dʒ', 'job'],
      ['s', 'see'],
      ['z', 'zoo'],
      ['ʃ', 'show'],
      ['ʒ', 'vision'],
      ['m', 'make'],
      ['n', 'win'],
      ['ŋ', 'sing'],
      ['h', 'have'],
      ['l', 'let'],
      ['r', 'read'],
      ['w', 'wear'],
      ['j', 'yes'],
    ],
  },
];
export function IpaHelpButton() {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="secondary ipa-help-trigger"
        onClick={() => setOpen(true)}
      >
        Cómo leer los sonidos
      </button>
      {open && (
        <Dialog
          title="Cómo leer los símbolos IPA"
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
        >
          <div className="ipa-help-content" tabIndex={0} role="region" aria-label="Guía de sonidos">
            <p>
              Cada símbolo representa un sonido, no una letra. Mira las palabras de ejemplo y
              distingue siempre el dialecto UK o US.
            </p>
            <dl className="ipa-reading-key">
              <dt>/ /</dt>
              <dd>Encierran la transcripción de los sonidos de una palabra.</dd>
              <dt>ˈ y ˌ</dt>
              <dd>
                Marcan el acento principal y el secundario antes de la sílaba acentuada: /əˈraɪz/.
              </dd>
              <dt>ː</dt>
              <dd>Indica una vocal larga: /iː/ en see, frente a /ɪ/ en sit.</dd>
              <dt>.</dt>
              <dd>Separa sílabas en algunas fuentes; no indica una pausa.</dd>
              <dt>(r)</dt>
              <dd>
                En UK, esa r se pronuncia si la palabra siguiente empieza por un sonido vocálico. El
                filtro contempla ambas posibilidades. En US, la r indicada se pronuncia.
              </dd>
              <dt>n y l silábicas</dt>
              <dd>
                Pueden formar una sílaba sin una vocal escrita en la transcripción: /ˈhɪdn/ en
                hidden. Otras fuentes escriben una schwa /ə/.
              </dd>
            </dl>
            {groups.map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                <div className="ipa-symbol-grid">
                  {group.sounds.map(([symbol, example]) => (
                    <div className="ipa-symbol" key={symbol}>
                      <strong>/{symbol}/</strong>
                      <span>{example}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <p>
              Se muestra una pronunciación representativa por forma y dialecto; en auxiliares como
              be se prefiere la forma fuerte. Puede haber otras pronunciaciones válidas. La r
              inglesa no equivale a la erre vibrante española.
            </p>
            <p>
              Guía inspirada en la leyenda del documento Cambridge face2face aportado, con notación
              actual y el diptongo US /oʊ/.{' '}
              <a
                href="https://www.oxfordlearnersdictionaries.com/about/pronunciation_english.html"
                target="_blank"
                rel="noreferrer"
              >
                Consultar la guía de pronunciación de Oxford
              </a>
              .
            </p>
          </div>
        </Dialog>
      )}
    </>
  );
}
