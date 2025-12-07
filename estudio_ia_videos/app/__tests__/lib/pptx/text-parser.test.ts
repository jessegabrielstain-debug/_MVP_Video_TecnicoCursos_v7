import { PPTXTextParser } from '@/lib/pptx/parsers/text-parser';
import JSZip from 'jszip';

// Mock JSZip
jest.mock('jszip');
jest.mock('xml2js');

describe('PPTXTextParser', () => {
  let parser: PPTXTextParser;
  let mockZip: jest.Mocked<JSZip>;

  beforeEach(() => {
    parser = new PPTXTextParser();
    mockZip = new JSZip() as jest.Mocked<JSZip>;
  });

  describe('extractText', () => {
    it('should extract text from slides successfully', async () => {
      // Mock slide files
      const mockSlideFiles = {
        'ppt/slides/slide1.xml': {
          async: jest.fn().mockResolvedValue(`
            <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
              <p:cSld>
                <p:spTree>
                  <p:sp>
                    <p:txBody>
                      <a:p>
                        <a:r>
                          <a:t>Test Title</a:t>
                        </a:r>
                      </a:p>
                    </p:txBody>
                  </p:sp>
                </p:spTree>
              </p:cSld>
            </p:sld>
          `)
        },
        'ppt/slides/slide2.xml': {
          async: jest.fn().mockResolvedValue(`
            <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
              <p:cSld>
                <p:spTree>
                  <p:sp>
                    <p:txBody>
                      <a:p>
                        <a:r>
                          <a:t>Content Text</a:t>
                        </a:r>
                      </a:p>
                    </p:txBody>
                  </p:sp>
                </p:spTree>
              </p:cSld>
            </p:sld>
          `)
        }
      };

      mockZip.file = jest.fn().mockImplementation((path: string) => {
        return mockSlideFiles[path as keyof typeof mockSlideFiles] || null;
      });

      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' },
        { name: 'ppt/slides/slide2.xml' }
      ]);

      const result = await parser.extractText(mockZip);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        slideNumber: 1,
        text: expect.stringContaining('Test Title')
      });
      expect(result[1]).toMatchObject({
        slideNumber: 2,
        text: expect.stringContaining('Content Text')
      });
    });

    it('should handle slides with no text content', async () => {
      const mockSlideFiles = {
        'ppt/slides/slide1.xml': {
          async: jest.fn().mockResolvedValue(`
            <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
              <p:cSld>
                <p:spTree>
                  <p:sp>
                    <!-- No text content -->
                  </p:sp>
                </p:spTree>
              </p:cSld>
            </p:sld>
          `)
        }
      };

      mockZip.file = jest.fn().mockImplementation((path: string) => {
        return mockSlideFiles[path as keyof typeof mockSlideFiles] || null;
      });

      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' }
      ]);

      const result = await parser.extractText(mockZip);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slideNumber: 1,
        text: '',
        formatting: [],
        bulletPoints: [],
        hyperlinks: []
      });
    });

    it('should handle parsing errors gracefully', async () => {
      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' }
      ]);

      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockRejectedValue(new Error('Parse error'))
      });

      const result = await parser.extractText(mockZip);

      expect(result).toHaveLength(0);
    });
  });

  describe('extractFormatting', () => {
    it('should extract text formatting correctly', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:rPr sz="2400" b="1" i="1" u="sng">
                        <a:solidFill>
                          <a:srgbClr val="FF0000"/>
                        </a:solidFill>
                        <a:latin typeface="Arial"/>
                      </a:rPr>
                      <a:t>Formatted Text</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
            </p:spTree>
          </p:cSld>
        </p:sld>
      `;

      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockXml)
      });

      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' }
      ]);

      const result = await parser.extractText(mockZip);

      expect(result[0].formatting).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontFamily: 'Arial',
            fontSize: 24,
            bold: true,
            italic: true,
            underline: true,
            color: '#FF0000'
          })
        ])
      );
    });
  });

  describe('extractBulletPoints', () => {
    it('should extract bullet points correctly', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:txBody>
                  <a:p>
                    <a:pPr>
                      <a:buChar char="•"/>
                    </a:pPr>
                    <a:r>
                      <a:t>First bullet point</a:t>
                    </a:r>
                  </a:p>
                  <a:p>
                    <a:pPr>
                      <a:buChar char="•"/>
                    </a:pPr>
                    <a:r>
                      <a:t>Second bullet point</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
            </p:spTree>
          </p:cSld>
        </p:sld>
      `;

      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockXml)
      });

      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' }
      ]);

      const result = await parser.extractText(mockZip);

      expect(result[0].bulletPoints).toEqual([
        'First bullet point',
        'Second bullet point'
      ]);
    });
  });

  describe('extractHyperlinks', () => {
    it('should extract hyperlinks correctly', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:rPr>
                        <a:hlinkClick r:id="rId1"/>
                      </a:rPr>
                      <a:t>Click here</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
            </p:spTree>
          </p:cSld>
        </p:sld>
      `;

      // Mock relationships file
      const mockRelsXml = `
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com"/>
        </Relationships>
      `;

      mockZip.file = jest.fn().mockImplementation((path: string) => {
        if (path === 'ppt/slides/slide1.xml') {
          return { async: jest.fn().mockResolvedValue(mockXml) };
        }
        if (path === 'ppt/slides/_rels/slide1.xml.rels') {
          return { async: jest.fn().mockResolvedValue(mockRelsXml) };
        }
        return null;
      });

      mockZip.filter = jest.fn().mockReturnValue([
        { name: 'ppt/slides/slide1.xml' }
      ]);

      const result = await parser.extractText(mockZip);

      expect(result[0].hyperlinks).toEqual([
        expect.objectContaining({
          text: 'Click here',
          url: 'https://example.com',
          target: '_blank'
        })
      ]);
    });
  });
});