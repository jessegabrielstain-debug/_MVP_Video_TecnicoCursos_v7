import { PPTXLayoutParser } from '@/lib/pptx/parsers/layout-parser';
import JSZip from 'jszip';

// Mock dependencies
jest.mock('jszip');
jest.mock('xml2js');

describe('PPTXLayoutParser', () => {
  let parser: PPTXLayoutParser;
  let mockZip: jest.Mocked<JSZip>;

  beforeEach(() => {
    parser = new PPTXLayoutParser();
    mockZip = new JSZip() as jest.Mocked<JSZip>;
    jest.clearAllMocks();
  });

  describe('detectLayout', () => {
    it('should detect title slide layout', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="ctrTitle"/>
                  </p:nvPr>
                </p:nvSpPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Main Title</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="subTitle"/>
                  </p:nvPr>
                </p:nvSpPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Subtitle</a:t>
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

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('title');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.elements).toHaveLength(2);
      expect(result.elements[0].type).toBe('title');
      expect(result.elements[1].type).toBe('subtitle');
    });

    it('should detect content slide layout', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="title"/>
                  </p:nvPr>
                </p:nvSpPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Slide Title</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="body"/>
                  </p:nvPr>
                </p:nvSpPr>
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

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('content');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.elements).toHaveLength(2);
      expect(result.elements[0].type).toBe('title');
      expect(result.elements[1].type).toBe('content');
    });

    it('should detect two-column layout', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="title"/>
                  </p:nvPr>
                </p:nvSpPr>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="9144000" cy="1143000"/>
                  </a:xfrm>
                </p:spPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Title</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
              <p:sp>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="0" y="1500000"/>
                    <a:ext cx="4500000" cy="4000000"/>
                  </a:xfrm>
                </p:spPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Left column content</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
              <p:sp>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="4644000" y="1500000"/>
                    <a:ext cx="4500000" cy="4000000"/>
                  </a:xfrm>
                </p:spPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Right column content</a:t>
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

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('two-column');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.elements).toHaveLength(3);
    });

    it('should detect image-content layout', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:sp>
                <p:nvSpPr>
                  <p:nvPr>
                    <p:ph type="title"/>
                  </p:nvPr>
                </p:nvSpPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Title with Image</a:t>
                    </a:r>
                  </a:p>
                </p:txBody>
              </p:sp>
              <p:pic>
                <p:nvPicPr>
                  <p:cNvPr id="2" name="Image 1"/>
                </p:nvPicPr>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="0" y="1500000"/>
                    <a:ext cx="4500000" cy="4000000"/>
                  </a:xfrm>
                </p:spPr>
              </p:pic>
              <p:sp>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="4644000" y="1500000"/>
                    <a:ext cx="4500000" cy="4000000"/>
                  </a:xfrm>
                </p:spPr>
                <p:txBody>
                  <a:p>
                    <a:r>
                      <a:t>Content next to image</a:t>
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

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('image-content');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.elements).toHaveLength(3);
      expect(result.elements.some(el => el.type === 'image')).toBe(true);
    });

    it('should detect full-image layout', async () => {
      const mockXml = `
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
          <p:cSld>
            <p:spTree>
              <p:pic>
                <p:nvPicPr>
                  <p:cNvPr id="1" name="Background Image"/>
                </p:nvPicPr>
                <p:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="9144000" cy="6858000"/>
                  </a:xfrm>
                </p:spPr>
              </p:pic>
            </p:spTree>
          </p:cSld>
        </p:sld>
      `;

      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockResolvedValue(mockXml)
      });

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('full-image');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].type).toBe('image');
    });

    it('should handle parsing errors gracefully', async () => {
      mockZip.file = jest.fn().mockReturnValue({
        async: jest.fn().mockRejectedValue(new Error('Parse error'))
      });

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.elements).toHaveLength(0);
    });

    it('should handle missing slide file', async () => {
      mockZip.file = jest.fn().mockReturnValue(null);

      const result = await parser.detectLayout(mockZip, 1);

      expect(result.layoutType).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.elements).toHaveLength(0);
    });
  });

  describe('extractLayoutElements', () => {
    it('should extract different element types correctly', async () => {
      const mockSlideData = {
        'p:sld': {
          'p:cSld': [{
            'p:spTree': [{
              'p:sp': [
                {
                  'p:nvSpPr': [{
                    'p:nvPr': [{ '$': { 'ph': { type: 'title' } } }]
                  }],
                  'p:txBody': [{ 'a:p': [{ 'a:r': [{ 'a:t': ['Title Text'] }] }] }]
                }
              ],
              'p:pic': [
                {
                  'p:nvPicPr': [{ 'p:cNvPr': [{ '$': { name: 'Image 1' } }] }],
                  'p:spPr': [{ 'a:xfrm': [{ 'a:off': [{ '$': { x: '0', y: '0' } }] }] }]
                }
              ]
            }]
          }]
        }
      };

      const elements = parser['extractLayoutElements'](mockSlideData);

      expect(elements).toHaveLength(2);
      expect(elements[0].type).toBe('text');
      expect(elements[1].type).toBe('image');
    });
  });

  describe('analyzeSlideContent', () => {
    it('should analyze content distribution correctly', () => {
      const elements = [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 4500000, height: 1000000 },
          content: 'Title'
        },
        {
          type: 'text', 
          position: { x: 0, y: 1500000, width: 4500000, height: 3000000 },
          content: 'Left content'
        },
        {
          type: 'text',
          position: { x: 4644000, y: 1500000, width: 4500000, height: 3000000 },
          content: 'Right content'
        }
      ];

      const analysis = parser['analyzeSlideContent'](elements);

      expect(analysis.hasTitle).toBe(true);
      expect(analysis.hasImages).toBe(false);
      expect(analysis.textBlocks).toBe(3);
      expect(analysis.imageCount).toBe(0);
      expect(analysis.contentDistribution.left).toBeGreaterThan(0);
      expect(analysis.contentDistribution.right).toBeGreaterThan(0);
    });
  });

  describe('detectLayoutType', () => {
    it('should detect title layout correctly', () => {
      const analysis = {
        hasTitle: true,
        hasSubtitle: true,
        hasImages: false,
        textBlocks: 2,
        imageCount: 0,
        contentDistribution: { left: 0.5, right: 0.5, center: 1.0, top: 1.0, bottom: 0 }
      };

      const layoutType = parser['detectLayoutType'](analysis);
      expect(layoutType).toBe('title');
    });

    it('should detect two-column layout correctly', () => {
      const analysis = {
        hasTitle: true,
        hasSubtitle: false,
        hasImages: false,
        textBlocks: 3,
        imageCount: 0,
        contentDistribution: { left: 0.8, right: 0.8, center: 0.2, top: 0.5, bottom: 0.5 }
      };

      const layoutType = parser['detectLayoutType'](analysis);
      expect(layoutType).toBe('two-column');
    });

    it('should detect image-content layout correctly', () => {
      const analysis = {
        hasTitle: true,
        hasSubtitle: false,
        hasImages: true,
        textBlocks: 2,
        imageCount: 1,
        contentDistribution: { left: 0.7, right: 0.7, center: 0.3, top: 0.5, bottom: 0.5 }
      };

      const layoutType = parser['detectLayoutType'](analysis);
      expect(layoutType).toBe('image-content');
    });

    it('should detect full-image layout correctly', () => {
      const analysis = {
        hasTitle: false,
        hasSubtitle: false,
        hasImages: true,
        textBlocks: 0,
        imageCount: 1,
        contentDistribution: { left: 0.9, right: 0.9, center: 0.9, top: 0.9, bottom: 0.9 }
      };

      const layoutType = parser['detectLayoutType'](analysis);
      expect(layoutType).toBe('full-image');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate high confidence for clear layouts', () => {
      const analysis = {
        hasTitle: true,
        hasSubtitle: true,
        hasImages: false,
        textBlocks: 2,
        imageCount: 0,
        contentDistribution: { left: 0.5, right: 0.5, center: 1.0, top: 1.0, bottom: 0 }
      };

      const confidence = parser['calculateConfidence']('title', analysis);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should calculate lower confidence for ambiguous layouts', () => {
      const analysis = {
        hasTitle: false,
        hasSubtitle: false,
        hasImages: false,
        textBlocks: 1,
        imageCount: 0,
        contentDistribution: { left: 0.3, right: 0.3, center: 0.4, top: 0.5, bottom: 0.5 }
      };

      const confidence = parser['calculateConfidence']('content', analysis);
      expect(confidence).toBeLessThan(0.6);
    });
  });
});