import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

// Função para criar um arquivo PPTX de teste com estrutura mínima
export async function createTestPPTX(filePath: string): Promise<void> {
  const zip = new JSZip();
  
  // Estrutura de diretórios e arquivos essenciais
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>');
  
  const ppt = zip.folder('ppt');
  if (ppt) {
    ppt.file('presentation.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:slideIdLst><p:sldId id="256" r:id="rId2"/></p:slideIdLst></p:presentation>');
    ppt.file('_rels/presentation.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>');
    
    const slides = ppt.folder('slides');
    if (slides) {
      slides.file('slide1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:r><a:t>Test Title</a:t></a:r></a:p><a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:r><a:t>Test Content</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>');
      slides.file('_rels/slide1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
    }
  }

  const docProps = zip.folder('docProps');
  if (docProps) {
    docProps.file('core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Test Presentation</dc:title><dc:creator>Test Author</dc:creator></cp:coreProperties>');
  }

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, content);
}

// Função para limpar os arquivos de teste
export function cleanupTestFiles(files?: string[]) {
  if (files) {
    files.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Função para criar um objeto File a partir de um caminho de arquivo
export async function createFileObject(filePath: string): Promise<File> {
    if (!fs.existsSync(filePath)) {
      // Retorna um objeto File "vazio" para simular um arquivo não encontrado
      return new File([], path.basename(filePath));
    }
    const buffer = fs.readFileSync(filePath);
    // O construtor do File no Node.js pode aceitar um Buffer diretamente
    return new File([buffer], path.basename(filePath), { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}

export async function createEmptyPPTX(filePath: string): Promise<void> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types" />');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  const ppt = zip.folder('ppt');
  if(ppt){
    ppt.file('presentation.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:slideIdLst/></p:presentation>');
  }
  
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, content);
}
