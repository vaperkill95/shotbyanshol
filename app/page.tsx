import Gallery from './Gallery';
import { photos } from './placeholder-data';

export default function Home() {
  // Later, `photos` gets replaced by a live fetch from the database.
  return <Gallery items={photos} />;
}
