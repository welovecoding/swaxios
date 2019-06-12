/* tslint:disable */

/**
 * This file was automatically generated by "Swaxios".
 * It should not be modified by hand.
 */

import {AxiosInstance} from 'axios';

export class ArchiveService {
  private readonly apiClient: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  /**
   * @param instanceId ID of instance to return
   */
  async postByInstanceId(
    instanceId: string,
    body: {archive: {}; conversationId: string}
  ): Promise<{instanceId: string; name: string}> {
    const resource = `/instance/${instanceId}/archive`;
    const response = await this.apiClient.post<{
      instanceId: string;
      name: string;
    }>(resource, {
      body,
    });
    return response.data;
  }
}