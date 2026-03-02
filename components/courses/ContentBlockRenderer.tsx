'use client';

import type { ContentBlock } from '@/types/courses';
import { ScriptureBlock } from './blocks/ScriptureBlock';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { KeyDefinitionBlock } from './blocks/KeyDefinitionBlock';
import { DiscussionBlock } from './blocks/DiscussionBlock';
import { SectionHeaderBlock } from './blocks/SectionHeaderBlock';
import { ReflectWriteBlock } from './blocks/ReflectWriteBlock';
import { IntrospectiveBlock } from './blocks/IntrospectiveBlock';
import { AskGodBlock } from './blocks/AskGodBlock';
import { MissionBlock } from './blocks/MissionBlock';
import { RevealTableBlock } from './blocks/RevealTableBlock';
import { InteractiveDiagramBlock } from './blocks/InteractiveDiagramBlock';
import { InteractiveWorksheetBlock } from './blocks/InteractiveWorksheetBlock';
import { PdfDownloadBlock } from './blocks/PdfDownloadBlock';
import { FeatureLinkBlock } from './blocks/FeatureLinkBlock';
import { BridgeLessonBlock } from './blocks/BridgeLessonBlock';

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'scripture':
      return <ScriptureBlock block={block} />;
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'keyDefinition':
      return <KeyDefinitionBlock block={block} />;
    case 'discussion':
      return <DiscussionBlock block={block} />;
    case 'sectionHeader':
      return <SectionHeaderBlock block={block} />;
    case 'reflectWrite':
      return <ReflectWriteBlock block={block} />;
    case 'introspective':
      return <IntrospectiveBlock block={block} />;
    case 'askGod':
      return <AskGodBlock block={block} />;
    case 'mission':
      return <MissionBlock block={block} />;
    case 'revealTable':
      return <RevealTableBlock block={block} />;
    case 'interactiveDiagram':
      return <InteractiveDiagramBlock block={block} />;
    case 'interactiveWorksheet':
      return <InteractiveWorksheetBlock block={block} />;
    case 'pdfDownload':
      return <PdfDownloadBlock block={block} />;
    case 'featureLink':
      return <FeatureLinkBlock block={block} />;
    case 'bridgeLesson':
      return <BridgeLessonBlock block={block} />;
    default:
      return null;
  }
}
