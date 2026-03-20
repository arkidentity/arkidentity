import Link from 'next/link';
import Image from 'next/image';
import { CourseLibrary } from '@courses/components/courses/CourseLibrary';

export default function Home() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-header-logo">
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={160}
              height={32}
              priority
              className="app-header-logo-img"
            />
          </Link>
        </div>
      </header>
      <CourseLibrary />
    </>
  );
}
