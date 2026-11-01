import { Art } from './Art';

export function HomeScreen({
  hasSave,
  onContinue,
  onCampaign,
  onChallenges,
  onEndless,
}: {
  hasSave: boolean;
  onContinue: () => void;
  onCampaign: () => void;
  onChallenges: () => void;
  onEndless: () => void;
}) {
  return (
    <section className="screen home" aria-label="Game introduction">
      <div className="home-copy">
        <div className="eyebrow"><span aria-hidden="true">✳ </span>A cozy little organizing game</div>
        <h1>A little mess. <em>A lot of satisfaction.</em></h1>
        <p>Find a home for every little thing. No rush, no pressure — just the joy of a perfectly tidy space.</p>
        <div className="home-actions">
          <button type="button" className="primary-button" onClick={onContinue}>
            {hasSave ? 'Continue' : 'Start tidying'} <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="secondary-button" onClick={onCampaign}>Campaign</button>
          <button type="button" className="secondary-button" onClick={onEndless}>Endless</button>
          <button type="button" className="secondary-button" onClick={onChallenges}>Challenges</button>
        </div>
      </div>
      <div className="home-gallery" aria-hidden="true">
        <span className="float-piece"><Art kind="hammer" /></span>
        <span className="float-piece"><Art kind="mug" /></span>
        <span className="float-piece"><Art kind="pot" /></span>
        <span className="float-piece"><Art kind="button" /></span>
      </div>
    </section>
  );
}
